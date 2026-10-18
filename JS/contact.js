const initContactForm = () => {
  const form = document.querySelector('[data-contact-form]');
  if (!form || form.dataset.initialized === 'true') return;
  form.dataset.initialized = 'true';

  const message = form.elements.message;
  const counter = document.querySelector('[data-message-count]');
  const status = document.querySelector('[data-form-status]');
  const submit = form.querySelector('[type="submit"]');
  const submitLabel = form.querySelector('[data-submit-label]');
  const directEmail = 'officialayushyadav15@gmail.com';
  const retryKey = 'portfolio-contact-retry-v1';
  let submitting = false;
  let memoryRetry = null;

  const setStatus = (state, content) => {
    status.dataset.state = state;
    status.replaceChildren();
    if (content) status.append(content);
  };

  const setDirectContactError = messageText => {
    const notice = document.createDocumentFragment();
    notice.append(messageText, ' You can also email me directly at ');
    const link = document.createElement('a');
    link.href = `mailto:${directEmail}`;
    link.textContent = directEmail;
    notice.append(link, '.');
    setStatus('error', notice);
  };

  const updateCounter = () => {
    counter.textContent = `${message.value.length} / ${message.maxLength}`;
  };

  const fingerprint = async values => {
    if (!window.crypto?.subtle) throw new Error('Secure retry identifiers require Web Crypto in a secure browser context.');
    const normalized = JSON.stringify([values.name, values.email, values.subject, values.message]);
    const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const newSubmissionId = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    if (!window.crypto?.getRandomValues) throw new Error('Secure submission IDs are unavailable in this browser.');
    return Array.from(window.crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const submissionIdentity = async values => {
    const currentFingerprint = await fingerprint(values);
    let saved = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(retryKey) || 'null');
    } catch (error) {
      console.warn('Contact retry storage could not be read; retry identity will be kept for this page session.', error.name);
      saved = memoryRetry;
    }

    if (saved?.fingerprint === currentFingerprint && saved?.id) return saved.id;

    const identity = { id: newSubmissionId(), fingerprint: currentFingerprint };
    memoryRetry = identity;
    try {
      sessionStorage.setItem(retryKey, JSON.stringify(identity));
    } catch (error) {
      console.warn('Contact retry identity could not be persisted across reloads.', error.name);
    }
    return identity.id;
  };

  const clearSubmissionIdentity = () => {
    memoryRetry = null;
    try {
      sessionStorage.removeItem(retryKey);
    } catch (error) {
      console.warn('Contact retry identity could not be cleared.', error.name);
    }
  };

  message.addEventListener('input', updateCounter);
  form.addEventListener('input', () => {
    if (status.dataset.state === 'error') setStatus('', null);
  });
  form.addEventListener('change', () => {
    if (status.dataset.state === 'error') setStatus('', null);
  });
  updateCounter();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;

    for (const field of form.querySelectorAll('input:not([type="hidden"]):not([name="bot-field"]), select, textarea')) {
      field.value = field.value.trim();
    }
    if (!form.reportValidity()) return;

    const endpoint = window.CONTACT_FORM_CONFIG?.apiEndpoint?.trim();
    if (!endpoint) {
      setDirectContactError('The contact form is not connected yet.');
      return;
    }

    const values = {
      name: form.elements.name.value,
      email: form.elements.email.value,
      subject: form.elements.subject.value,
      message: form.elements.message.value
    };

    if (String(form.elements['bot-field']?.value || '').trim()) {
      setStatus('', null);
      return;
    }

    submitting = true;
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    submitLabel.textContent = 'Sending…';
    setStatus('', null);

    try {
      const id = await submissionIdentity(values);
      const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          submissionId: id,
          honeypot: String(form.elements['bot-field']?.value || '')
        })
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`The contact service returned an unverifiable response (HTTP ${response.status}).`);
      }

      if (result.submissionId !== id || result.saved !== true) {
        throw new Error(`The contact service did not confirm that this enquiry was saved (HTTP ${response.status}).`);
      }

      const emailStatus = ['Sent', 'Failed', 'Pending', 'Sending', 'Unknown'].includes(result.emailStatus)
        ? result.emailStatus
        : 'Unknown';
      if (response.ok && emailStatus === 'Sent') {
        console.info('Contact service confirmed the enquiry was saved and the email notification was accepted.');
        setStatus('success', 'Your enquiry was saved and the email notification was sent. I’ll get back to you within 24–48 hours.');
        clearSubmissionIdentity();
        form.reset();
        updateCounter();
      } else {
        console.warn('Contact service saved the enquiry, but email notification status needs attention.', {
          emailStatus,
          statusUpdated: result.statusUpdated
        });
        const notice = document.createDocumentFragment();
        notice.append('Your enquiry was saved, but email notification status is ');
        const state = document.createElement('strong');
        state.textContent = emailStatus.toLowerCase();
        notice.append(state, '. Your message is safely recorded.');
        setStatus('partial', notice);
        clearSubmissionIdentity();
        form.reset();
        updateCounter();
      }
    } catch (error) {
      console.error('Contact submission could not be confirmed. The enquiry may already have been saved; retrying unchanged details will reuse its submission ID.', error);
      setDirectContactError('We could not confirm whether your enquiry was saved. Your message is still here; try again to safely check the same submission.');
    } finally {
      submitting = false;
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      submitLabel.textContent = 'Send Message';
    }
  });
};

window.initContactForm = initContactForm;
document.addEventListener('DOMContentLoaded', initContactForm);
document.addEventListener('portfolio-page-ready', initContactForm);
initContactForm();
