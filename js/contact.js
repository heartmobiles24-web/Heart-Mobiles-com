/**
 * contact.js - contact form validation and submission.
 *
 * A static site cannot send email on its own, so the form needs a form service
 * or serverless endpoint. Until one is configured (see FORM_ENDPOINT in
 * js/config.js) the form never claims success - it offers WhatsApp and calling
 * instead, and clearly tells the visitor what to do.
 */

import { getSite, whatsAppUrl, FORM_ENDPOINT } from './config.js';

const RULES = {
  name: { required: true, min: 2, label: 'your name' },
  phone: { required: true, pattern: /^[+()\d\s-]{10,18}$/, label: 'a valid phone number' },
  email: { required: false, pattern: /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i, label: 'a valid email address' },
  message: { required: true, min: 10, label: 'a message of at least 10 characters' }
};

function showToast({ icon, title, text, confirmButtonText = 'OK', showCancelButton = false, cancelButtonText = 'Cancel' }) {
  if (window.Swal) {
    return window.Swal.fire({
      icon,
      title,
      text,
      confirmButtonText,
      showCancelButton,
      cancelButtonText,
      confirmButtonColor: '#153b63',
      cancelButtonColor: '#64748b'
    });
  }
  window.alert([title, text].filter(Boolean).join('\n\n'));
  return Promise.resolve({ isConfirmed: true });
}

function fieldError(input, message) {
  const error = document.getElementById(`${input.id}-error`);
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
  } else {
    input.removeAttribute('aria-invalid');
    if (error) {
      error.textContent = '';
      error.hidden = true;
    }
  }
}

function validateInput(input) {
  const rule = RULES[input.name];
  if (!rule) return true;

  const value = (input.value || '').trim();

  if (rule.required && !value) {
    fieldError(input, `Please enter ${rule.label}.`);
    return false;
  }
  if (!value) {
    fieldError(input, '');
    return true;
  }
  if (rule.min && value.length < rule.min) {
    fieldError(input, `Please enter ${rule.label}.`);
    return false;
  }
  if (rule.pattern && !rule.pattern.test(value)) {
    fieldError(input, `Please enter ${rule.label}.`);
    return false;
  }

  fieldError(input, '');
  return true;
}

function collect(form) {
  const data = new FormData(form);
  return {
    name: String(data.get('name') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    email: String(data.get('email') || '').trim(),
    subject: String(data.get('subject') || 'General enquiry').trim(),
    message: String(data.get('message') || '').trim()
  };
}

function composeMessage(values) {
  return [
    'Assalamu Alaikum! I am contacting you through the Heart Mobiles website.',
    '',
    `Name: ${values.name}`,
    `Phone: ${values.phone}`,
    values.email ? `Email: ${values.email}` : '',
    `Subject: ${values.subject}`,
    '',
    values.message
  ]
    .filter(Boolean)
    .join('\n');
}

export async function initContact() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const site = await getSite();
  const status = document.getElementById('contact-form-status');
  const inputs = Array.from(form.querySelectorAll('input[name], textarea[name], select[name]')).filter(
    (el) => el.name in RULES
  );

  inputs.forEach((input) => {
    input.addEventListener('blur', () => validateInput(input));
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validateInput(input);
    });
  });

  // Optional WhatsApp shortcut - works even without a form endpoint.
  const whatsappButton = document.getElementById('contact-whatsapp');
  if (whatsappButton) {
    whatsappButton.addEventListener('click', () => {
      const values = collect(form);
      if (!values.message) {
        showToast({
          icon: 'info',
          title: 'Add a short message',
          text: 'Please write your enquiry so it can be sent on WhatsApp.'
        });
        return;
      }
      window.open(whatsAppUrl(site.whatsapp, composeMessage(values)), '_blank', 'noopener');
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const valid = inputs.map((input) => validateInput(input)).every(Boolean);
    const consent = form.querySelector('#cf-consent');

    if (consent && !consent.checked) {
      fieldError(consent, 'Please confirm before sending your enquiry.');
      showToast({
        icon: 'warning',
        title: 'Almost there',
        text: 'Please tick the confirmation checkbox so we know we may contact you.'
      });
      return;
    }

    if (!valid) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      showToast({
        icon: 'error',
        title: 'Please check the form',
        text: 'Some details are missing or incomplete. The fields are highlighted for you.'
      });
      return;
    }

    const values = collect(form);

    if (!FORM_ENDPOINT) {
      if (status) {
        status.textContent = 'This form is not connected yet. Please use WhatsApp or call the shop - both work instantly.';
      }
      const result = await showToast({
        icon: 'info',
        title: 'Form not connected yet',
        text: 'The enquiry form still needs a form service to be connected. Meanwhile, you can send the same details on WhatsApp in one tap.',
        confirmButtonText: 'Send on WhatsApp',
        showCancelButton: true,
        cancelButtonText: 'Close'
      });
      if (result.isConfirmed) {
        window.open(whatsAppUrl(site.whatsapp, composeMessage(values)), '_blank', 'noopener');
      }
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.label = submitButton.textContent;
      submitButton.textContent = 'Sending...';
    }

    try {
      const payload = new FormData(form);
      payload.append('page', window.location.href);

      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: payload,
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      form.reset();
      inputs.forEach((input) => fieldError(input, ''));
      if (status) status.textContent = 'Your enquiry was sent successfully.';
      showToast({
        icon: 'success',
        title: 'Enquiry sent',
        text: 'Thank you. Your message has reached Heart Mobiles and the team will contact you soon.'
      });
    } catch (error) {
      if (status) status.textContent = 'The enquiry could not be sent. Please try WhatsApp or call the shop.';
      const result = await showToast({
        icon: 'error',
        title: 'Could not send the enquiry',
        text: 'Something went wrong while sending your message. You can send the same details on WhatsApp instead.',
        confirmButtonText: 'Send on WhatsApp',
        showCancelButton: true,
        cancelButtonText: 'Close'
      });
      if (result.isConfirmed) {
        window.open(whatsAppUrl(site.whatsapp, composeMessage(values)), '_blank', 'noopener');
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitButton.dataset.label || 'Send enquiry';
      }
    }
  });
}
