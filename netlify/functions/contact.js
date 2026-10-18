'use strict';

const MAX_BODY_BYTES = 12 * 1024;
const MAX_UPSTREAM_RESPONSE_BYTES = 16 * 1024;
const UPSTREAM_TIMEOUT_MS = 12_000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 8;
const MAX_RATE_BUCKETS = 512;
const VALID_SUBJECTS = new Set([
  'Salesforce Development',
  'API Integration',
  'Lightning Web Components',
  'Job Opportunity',
  'Collaboration',
  'Other'
]);
const EMAIL_STATUSES = new Set(['Sent', 'Failed', 'Pending', 'Sending', 'Unknown']);
const requestBuckets = new Map();

function jsonResponse(statusCode, body, origin) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Origin'
  };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '600';
  }
  return { statusCode, headers, body: statusCode === 204 ? '' : JSON.stringify(body) };
}

function header(headers, name) {
  const key = Object.keys(headers || {}).find(item => item.toLowerCase() === name.toLowerCase());
  return key ? String(headers[key]) : '';
}

function configuredOrigin() {
  const value = String(process.env.CONTACT_ALLOWED_ORIGIN || '').trim();
  if (!value) return '';
  try {
    const parsed = new URL(value);
    const localHttp = parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    if ((!localHttp && parsed.protocol !== 'https:') || parsed.origin !== value || parsed.username || parsed.password) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function checkOrigin(event, allowedOrigin) {
  const origin = header(event.headers, 'origin');
  if (!allowedOrigin) return { ok: false, status: 503, code: 'ALLOWED_ORIGIN_NOT_CONFIGURED' };
  if (!origin) return { ok: false, status: 403, code: 'ORIGIN_REQUIRED' };
  if (allowedOrigin !== origin) return { ok: false, status: 403, code: 'ORIGIN_NOT_ALLOWED' };
  return { ok: true, origin: allowedOrigin };
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return 'INVALID_REQUEST';
  const expectedKeys = new Set(['submissionId', 'name', 'email', 'subject', 'message', 'honeypot']);
  if (Object.keys(payload).some(key => !expectedKeys.has(key))) return 'INVALID_REQUEST';
  for (const field of ['submissionId', 'name', 'email', 'subject', 'message']) {
    if (typeof payload[field] !== 'string') return 'INVALID_REQUEST';
  }
  if (payload.honeypot !== undefined && typeof payload.honeypot !== 'string') return 'INVALID_REQUEST';

  const enquiry = {
    submissionId: payload.submissionId.trim(),
    name: payload.name.trim(),
    email: payload.email.trim(),
    subject: payload.subject.trim(),
    message: payload.message.trim(),
    honeypot: String(payload.honeypot || '').trim()
  };
  if (enquiry.honeypot) return 'SPAM_REJECTED';
  if (!/^[a-zA-Z0-9-]{20,80}$/.test(enquiry.submissionId)) return 'INVALID_SUBMISSION_ID';
  if (enquiry.name.length < 2 || enquiry.name.length > 100) return 'INVALID_NAME';
  if (enquiry.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email)) return 'INVALID_EMAIL';
  if (enquiry.subject.length > 80 || !VALID_SUBJECTS.has(enquiry.subject)) return 'INVALID_SUBJECT';
  if (enquiry.message.length < 10 || enquiry.message.length > 2000) return 'INVALID_MESSAGE';
  return enquiry;
}

function rateLimit(event) {
  const now = Date.now();
  for (const [key, bucket] of requestBuckets) {
    if (now - bucket.startedAt >= RATE_WINDOW_MS) requestBuckets.delete(key);
  }
  const ip = header(event.headers, 'x-nf-client-connection-ip') || 'unknown';
  if (!requestBuckets.has(ip) && requestBuckets.size >= MAX_RATE_BUCKETS) {
    const oldestKey = requestBuckets.keys().next().value;
    if (oldestKey) requestBuckets.delete(oldestKey);
  }

  let bucket = requestBuckets.get(ip);
  if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
    bucket = { startedAt: now, count: 0 };
    requestBuckets.set(ip, bucket);
  }
  bucket.count += 1;
  return bucket.count <= RATE_LIMIT;
}

function readRequestBody(event) {
  if (!/^application\/json(?:\s*;|\s*$)/i.test(header(event.headers, 'content-type'))) {
    return { error: { status: 415, code: 'UNSUPPORTED_CONTENT_TYPE' } };
  }
  const rawBody = String(event.body || '');
  if (event.isBase64Encoded
    ? rawBody.length > Math.ceil(MAX_BODY_BYTES * 4 / 3) + 4
    : Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return { error: { status: 413, code: 'REQUEST_TOO_LARGE' } };
  }
  let body;
  try {
    body = event.isBase64Encoded ? Buffer.from(rawBody, 'base64') : Buffer.from(rawBody, 'utf8');
  } catch {
    return { error: { status: 400, code: 'INVALID_REQUEST' } };
  }
  const declaredLength = Number(header(event.headers, 'content-length'));
  if (body.length > MAX_BODY_BYTES || (declaredLength && declaredLength > MAX_BODY_BYTES)) {
    return { error: { status: 413, code: 'REQUEST_TOO_LARGE' } };
  }
  try {
    return { payload: JSON.parse(body.toString('utf8')) };
  } catch {
    return { error: { status: 400, code: 'INVALID_JSON' } };
  }
}

function appsScriptConfiguration() {
  const endpointValue = String(process.env.GOOGLE_APPS_SCRIPT_URL || '').trim();
  const secret = String(process.env.CONTACT_SHARED_SECRET || '');
  if (!endpointValue || !secret) return { error: 'UPSTREAM_CONFIGURATION_MISSING' };
  let endpoint;
  try {
    endpoint = new URL(endpointValue);
  } catch {
    return { error: 'UPSTREAM_CONFIGURATION_INVALID' };
  }
  if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'script.google.com' || !/^\/macros\/s\/[^/]+\/exec\/?$/.test(endpoint.pathname) || endpoint.username || endpoint.password) {
    return { error: 'UPSTREAM_CONFIGURATION_INVALID' };
  }
  return { endpoint: endpoint.href, secret };
}

async function fetchAppsScript(endpoint, secret, enquiry) {
  let url = new URL(endpoint);
  let method = 'POST';
  let body = JSON.stringify({ ...enquiry, secret });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  if (typeof timeout.unref === 'function') timeout.unref();

  try {
    for (let redirects = 0; redirects <= 5; redirects += 1) {
      const response = await fetch(url, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: method === 'POST' ? body : undefined,
        redirect: 'manual',
        signal: controller.signal
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location || redirects === 5) throw new Error('UPSTREAM_REDIRECT_INVALID');
        let nextUrl;
        try {
          nextUrl = new URL(location, url);
        } catch {
          throw new Error('UPSTREAM_REDIRECT_INVALID');
        }
        if (nextUrl.protocol !== 'https:' || !['script.google.com', 'script.googleusercontent.com'].includes(nextUrl.hostname) || nextUrl.port || nextUrl.username || nextUrl.password) {
          throw new Error('UPSTREAM_REDIRECT_INVALID');
        }
        if ([301, 302, 303].includes(response.status)) {
          method = 'GET';
          body = undefined;
        }
        url = nextUrl;
        continue;
      }

      const responseText = await response.text();
      if (Buffer.byteLength(responseText, 'utf8') > MAX_UPSTREAM_RESPONSE_BYTES) throw new Error('UPSTREAM_RESPONSE_TOO_LARGE');
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error('UPSTREAM_RESPONSE_UNREADABLE');
      }
      return { httpOk: response.ok, result };
    }
  } finally {
    clearTimeout(timeout);
  }
  throw new Error('UPSTREAM_REDIRECT_INVALID');
}

function backendResponse(event, origin, submissionId, upstream) {
  const result = upstream.result;
  const response = {
    ok: result && result.ok === true,
    saved: result && result.saved === true,
    submissionId,
    emailStatus: EMAIL_STATUSES.has(result && result.emailStatus) ? result.emailStatus : 'Unknown'
  };
  if (result && typeof result.duplicate === 'boolean') response.duplicate = result.duplicate;
  if (result && typeof result.statusUpdated === 'boolean') response.statusUpdated = result.statusUpdated;

  if (!result || result.submissionId !== submissionId) {
    return jsonResponse(502, { ok: false, saved: false, code: 'UPSTREAM_RESPONSE_MISMATCH', submissionId }, origin);
  }
  if (!response.saved) {
    return jsonResponse(502, { ...response, ok: false, code: typeof result.code === 'string' ? result.code : 'ENQUIRY_NOT_SAVED' }, origin);
  }
  if (!upstream.httpOk) {
    return jsonResponse(502, { ...response, ok: false, code: 'UPSTREAM_HTTP_ERROR' }, origin);
  }
  return jsonResponse(200, response, origin);
}

exports.handler = async function handler(event) {
  const method = String(event.httpMethod || '').toUpperCase();
  const allowedOrigin = configuredOrigin();
  if (allowedOrigin === null) return jsonResponse(503, { ok: false, saved: false, code: 'ALLOWED_ORIGIN_CONFIGURATION_INVALID' });

  const originCheck = checkOrigin(event, allowedOrigin);
  if (!originCheck.ok) return jsonResponse(originCheck.status, { ok: false, saved: false, code: originCheck.code });
  const origin = originCheck.origin;

  if (method === 'OPTIONS') {
    return jsonResponse(204, {}, origin);
  }
  if (method !== 'POST') {
    return jsonResponse(405, { ok: false, saved: false, code: 'METHOD_NOT_ALLOWED' }, origin);
  }
  if (!rateLimit(event)) return jsonResponse(429, { ok: false, saved: false, code: 'RATE_LIMITED' }, origin);

  const request = readRequestBody(event);
  if (request.error) return jsonResponse(request.error.status, { ok: false, saved: false, code: request.error.code }, origin);
  const enquiry = validatePayload(request.payload);
  if (typeof enquiry === 'string') return jsonResponse(400, { ok: false, saved: false, code: enquiry }, origin);

  const config = appsScriptConfiguration();
  if (config.error) return jsonResponse(503, { ok: false, saved: false, code: config.error, submissionId: enquiry.submissionId }, origin);

  try {
    const upstream = await fetchAppsScript(config.endpoint, config.secret, enquiry);
    return backendResponse(event, origin, enquiry.submissionId, upstream);
  } catch (error) {
    const code = error && error.name === 'AbortError' ? 'UPSTREAM_TIMEOUT' :
      (error && ['UPSTREAM_REDIRECT_INVALID', 'UPSTREAM_RESPONSE_TOO_LARGE', 'UPSTREAM_RESPONSE_UNREADABLE'].includes(error.message)
        ? error.message
        : 'UPSTREAM_FAILURE');
    return jsonResponse(502, { ok: false, saved: false, code, submissionId: enquiry.submissionId }, origin);
  }
};
