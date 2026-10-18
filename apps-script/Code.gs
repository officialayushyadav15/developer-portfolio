const REQUIRED_PROPERTIES = [
  'SPREADSHEET_ID',
  'SHEET_NAME',
  'NOTIFICATION_EMAIL',
  'CONTACT_SHARED_SECRET'
];

const HEADERS = [
  'Submission ID',
  'Timestamp',
  'Name',
  'Email',
  'Subject',
  'Message',
  'Email Status',
  'Email Error'
];

const VALID_SUBJECTS = [
  'Salesforce Development',
  'API Integration',
  'Lightning Web Components',
  'Job Opportunity',
  'Collaboration',
  'Other'
];

function doPost(event) {
  try {
    const config = readConfig_();
    const payload = parsePayload_(event);

    if (!constantTimeEquals_(String(payload.secret || ''), config.secret)) {
      return jsonResponse_({ ok: false, saved: false, code: 'UNAUTHORIZED' });
    }

    if (String(payload.honeypot || '').trim()) {
      return jsonResponse_({ ok: false, saved: false, code: 'INVALID_REQUEST' });
    }

    const enquiry = validateEnquiry_(payload);
    const saved = saveEnquiry_(config, enquiry);
    return jsonResponse_(deliverNotification_(config, enquiry, saved.duplicate));
  } catch (error) {
    console.error('Contact request failed.', safeErrorName_(error));
    return jsonResponse_({
      ok: false,
      saved: false,
      code: error.contactCode || 'REQUEST_FAILED'
    });
  }
}

function authorizeContactIntegrations() {
  const config = readConfig_();
  const spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
  const sheet = spreadsheet.getSheetByName(config.sheetName);
  if (!sheet) throw contactError_('SHEET_NOT_FOUND');
  MailApp.getRemainingDailyQuota();
  console.info('Contact integration permissions are authorized.');
}

function readConfig_() {
  const properties = PropertiesService.getScriptProperties();
  const values = properties.getProperties();
  const missing = REQUIRED_PROPERTIES.filter(function (key) {
    return !String(values[key] || '').trim();
  });
  if (missing.length) throw contactError_('CONFIGURATION_MISSING');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.NOTIFICATION_EMAIL)) {
    throw contactError_('CONFIGURATION_INVALID');
  }

  return {
    spreadsheetId: values.SPREADSHEET_ID.trim(),
    sheetName: values.SHEET_NAME.trim(),
    notificationEmail: values.NOTIFICATION_EMAIL.trim(),
    secret: values.CONTACT_SHARED_SECRET
  };
}

function parsePayload_(event) {
  if (!event || !event.postData || typeof event.postData.contents !== 'string') {
    throw contactError_('INVALID_REQUEST');
  }
  try {
    const payload = JSON.parse(event.postData.contents);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Invalid JSON object');
    }
    return payload;
  } catch (error) {
    throw contactError_('INVALID_JSON');
  }
}

function validateEnquiry_(payload) {
  const enquiry = {
    submissionId: String(payload.submissionId || '').trim(),
    name: String(payload.name || '').trim(),
    email: String(payload.email || '').trim(),
    subject: String(payload.subject || '').trim(),
    message: String(payload.message || '').trim()
  };

  if (!/^[a-zA-Z0-9-]{20,80}$/.test(enquiry.submissionId)) {
    throw contactError_('INVALID_SUBMISSION_ID');
  }
  if (enquiry.name.length < 2 || enquiry.name.length > 100) {
    throw contactError_('INVALID_NAME');
  }
  if (enquiry.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email)) {
    throw contactError_('INVALID_EMAIL');
  }
  if (enquiry.subject.length > 80 || VALID_SUBJECTS.indexOf(enquiry.subject) === -1) {
    throw contactError_('INVALID_SUBJECT');
  }
  if (enquiry.message.length < 10 || enquiry.message.length > 2000) {
    throw contactError_('INVALID_MESSAGE');
  }
  return enquiry;
}

function saveEnquiry_(config, enquiry) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet_(config);
    ensureHeaders_(sheet);
    const existingRow = findSubmissionRow_(sheet, enquiry.submissionId);
    if (existingRow) {
      return {
        duplicate: true,
        emailStatus: String(sheet.getRange(existingRow, 7).getDisplayValue() || 'Pending')
      };
    }

    const row = sheet.getLastRow() + 1;
    const values = [
      enquiry.submissionId,
      new Date(),
      sheetSafeText_(enquiry.name),
      sheetSafeText_(enquiry.email),
      sheetSafeText_(enquiry.subject),
      sheetSafeText_(enquiry.message),
      'Pending',
      ''
    ];
    sheet.getRange(row, 1, 1, HEADERS.length).setValues([values]);
    SpreadsheetApp.flush();

    if (String(sheet.getRange(row, 1).getDisplayValue()) !== enquiry.submissionId) {
      throw contactError_('SHEET_WRITE_UNCONFIRMED');
    }
    return { duplicate: false, emailStatus: 'Pending' };
  } catch (error) {
    if (error.contactCode) throw error;
    throw contactError_('SHEET_WRITE_FAILED');
  } finally {
    lock.releaseLock();
  }
}

function updateEmailStatus_(config, submissionId, status, errorName) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet_(config);
    const row = findSubmissionRow_(sheet, submissionId);
    if (!row) throw contactError_('SAVED_ROW_NOT_FOUND');
    sheet.getRange(row, 7, 1, 2).setValues([[status, errorName]]);
    SpreadsheetApp.flush();
    if (String(sheet.getRange(row, 7).getDisplayValue()) !== status) {
      throw contactError_('STATUS_WRITE_UNCONFIRMED');
    }
  } finally {
    lock.releaseLock();
  }
}

function claimEmailDelivery_(config, submissionId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet_(config);
    const row = findSubmissionRow_(sheet, submissionId);
    if (!row) throw contactError_('SAVED_ROW_NOT_FOUND');
    const currentStatus = String(sheet.getRange(row, 7).getDisplayValue() || 'Pending');
    if (currentStatus !== 'Pending') return { claimed: false, status: currentStatus };
    sheet.getRange(row, 7).setValue('Sending');
    SpreadsheetApp.flush();
    if (String(sheet.getRange(row, 7).getDisplayValue()) !== 'Sending') {
      throw contactError_('EMAIL_CLAIM_UNCONFIRMED');
    }
    return { claimed: true, status: 'Sending' };
  } finally {
    lock.releaseLock();
  }
}

function deliverNotification_(config, enquiry, duplicate) {
  let claim;
  try {
    claim = claimEmailDelivery_(config, enquiry.submissionId);
  } catch (error) {
    console.error('Contact notification could not be claimed.', safeErrorName_(error));
    return {
      ok: false,
      saved: true,
      duplicate: duplicate,
      submissionId: enquiry.submissionId,
      emailStatus: 'Unknown',
      statusUpdated: false
    };
  }

  if (!claim.claimed) {
    return {
      ok: true,
      saved: true,
      duplicate: duplicate,
      submissionId: enquiry.submissionId,
      emailStatus: claim.status,
      statusUpdated: true
    };
  }

  let emailStatus = 'Sent';
  let emailError = '';
  try {
    sendNotification_(config.notificationEmail, enquiry);
  } catch (error) {
    emailStatus = 'Failed';
    emailError = safeErrorName_(error);
    console.error('Contact notification email failed.', emailError);
  }

  let statusUpdated = true;
  try {
    updateEmailStatus_(config, enquiry.submissionId, emailStatus, emailError);
  } catch (error) {
    statusUpdated = false;
    console.error('Contact row email status update failed.', safeErrorName_(error));
  }

  return {
    ok: true,
    saved: true,
    duplicate: duplicate,
    submissionId: enquiry.submissionId,
    emailStatus: statusUpdated ? emailStatus : 'Unknown',
    statusUpdated: statusUpdated
  };
}

function getSheet_(config) {
  const spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
  const sheet = spreadsheet.getSheetByName(config.sheetName);
  if (!sheet) throw contactError_('SHEET_NOT_FOUND');
  return sheet;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    SpreadsheetApp.flush();
    return;
  }
  const actual = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
  if (HEADERS.some(function (header, index) { return actual[index] !== header; })) {
    throw contactError_('SHEET_HEADERS_INVALID');
  }
}

function findSubmissionRow_(sheet, submissionId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  for (let index = 0; index < ids.length; index += 1) {
    if (ids[index][0] === submissionId) return index + 2;
  }
  return 0;
}

function sendNotification_(recipient, enquiry) {
  const subject = 'Portfolio enquiry: ' + enquiry.subject;
  const body = [
    'A new portfolio enquiry was saved to Google Sheets.',
    '',
    'Submission ID: ' + enquiry.submissionId,
    'Name: ' + enquiry.name,
    'Email: ' + enquiry.email,
    'Subject: ' + enquiry.subject,
    '',
    'Message:',
    enquiry.message
  ].join('\n');
  const htmlBody = [
    '<p>A new portfolio enquiry was saved to Google Sheets.</p>',
    '<p><b>Submission ID:</b> ' + escapeHtml_(enquiry.submissionId) + '<br>',
    '<b>Name:</b> ' + escapeHtml_(enquiry.name) + '<br>',
    '<b>Email:</b> ' + escapeHtml_(enquiry.email) + '<br>',
    '<b>Subject:</b> ' + escapeHtml_(enquiry.subject) + '</p>',
    '<p><b>Message</b><br>' + escapeHtml_(enquiry.message).replace(/\n/g, '<br>') + '</p>'
  ].join('');

  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    body: body,
    htmlBody: htmlBody,
    replyTo: enquiry.email,
    name: 'Portfolio Contact Form'
  });
}

function sheetSafeText_(value) {
  return /^[\s]*[=+@-]/.test(value) ? "'" + value : value;
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function constantTimeEquals_(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function safeErrorName_(error) {
  return String(error && error.name ? error.name : 'Error').slice(0, 80);
}

function contactError_(code) {
  const error = new Error(code);
  error.contactCode = code;
  return error;
}

function jsonResponse_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}



function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      service: "Portfolio Contact API",
      message: "The web app is running."
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function testContactIntegration() {
  const properties = PropertiesService.getScriptProperties();
  const secret = properties.getProperty('CONTACT_SHARED_SECRET');

  if (!secret) {
    throw new Error('CONTACT_SHARED_SECRET is missing.');
  }

  const testPayload = {
    secret: secret,
    honeypot: '',
    submissionId: 'test-' + Utilities.getUuid(),
    name: 'Portfolio Integration Test',
    email: properties.getProperty('NOTIFICATION_EMAIL'),
    subject: 'Other',
    message: 'This is a test submission to verify the portfolio contact integration.'
  };

  const result = doPost({
    postData: {
      contents: JSON.stringify(testPayload)
    }
  });

  console.log('Test response: ' + result.getContent());
}
