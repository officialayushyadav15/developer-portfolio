// Netlify serves this same-origin function locally via `netlify dev` and after deployment.
// Never put the Apps Script URL or shared secret in this browser-delivered file.
window.CONTACT_FORM_CONFIG = Object.freeze({
  apiEndpoint: '/.netlify/functions/contact'
});
