# Contact form: Google Sheets and email

The contact form sends JSON to `/.netlify/functions/contact` (configured in `JS/contact-config.js`). That Netlify Function forwards the existing Apps Script contract from the server, adding `CONTACT_SHARED_SECRET` without exposing it to the browser. The browser must never call Apps Script directly.

The Apps Script implementation is in `apps-script/Code.gs`. It validates and authenticates a request, writes the enquiry row, confirms the write, then attempts email notification and records `Sent` or `Failed`. Submission IDs make retries idempotent for the sheet. Email delivery is not exactly once: a crash after MailApp accepts a notification but before the status update can leave the row in `Sending`; inspect the row and execution log before any manual resend.

## Google Sheet setup

1. Create a spreadsheet and a tab named `Enquiries` (or choose another tab name for the `SHEET_NAME` property).
2. Leave the tab empty, or put these exact headers in row 1, in this order:

   `Submission ID`, `Timestamp`, `Name`, `Email`, `Subject`, `Message`, `Email Status`, `Email Error`

   If the tab is empty, the script creates the header row. It will stop if existing headers do not match.
3. Copy the spreadsheet ID from its URL. Do not put it in frontend code.

## Apps Script setup and authorization

1. Open the Apps Script project you already created and replace/add its `Code.gs` with the contents of [`apps-script/Code.gs`](apps-script/Code.gs).
2. In **Project Settings → Script properties**, add:

   | Property | Value |
   | --- | --- |
   | `SPREADSHEET_ID` | The spreadsheet ID |
   | `SHEET_NAME` | `Enquiries` or your exact tab name |
   | `NOTIFICATION_EMAIL` | The address that should receive enquiries |
   | `CONTACT_SHARED_SECRET` | A long random secret; generate your own |

3. Never put the secret in `JS/contact-config.js`, HTML, or any other browser-delivered file. Give the same secret to the future server-side proxy through that host’s private environment/configuration setting.
4. Select `authorizeContactIntegrations` in Apps Script and run it once. Review and grant the requested spreadsheet and mail permissions. It logs no enquiry data or secret.
5. Choose **Deploy → New deployment → Web app**. Set **Execute as** to your account so writes/mail use your authorization. Set access to **Anyone** so the future proxy can reach it, then deploy and authorize if prompted.
6. Copy the deployed web app URL ending in `/exec`. Use that URL only in the proxy’s private server configuration. Do not paste it into the browser config. Use the deployed `/exec` URL, not the editor URL or a `/dev` test URL.
7. After changing Apps Script code, create a new deployment version or edit the deployment to use the new version.

The web app must be publicly reachable for a proxy to call it, but it requires the shared secret in the JSON request body. Public access still permits unauthenticated requests to reach the script and consume execution quota. Keep the secret strong, rate-limit the public proxy, monitor Apps Script executions, and rotate the secret if exposed.

## Netlify Function configuration

The proxy is `netlify/functions/contact.js`, explicitly registered in `netlify.toml` under `functions.directory`. It accepts the form's existing JSON fields only when the request has the configured exact browser `Origin`, validates them, forwards them plus the server-side secret, follows only HTTPS redirects to the exact hosts `script.google.com` and `script.googleusercontent.com`, and returns the original submission ID with the backend's saved/email status. Google Apps Script ContentService redirects returned content to a one-time URL on `script.googleusercontent.com` ([Google documentation](https://developers.google.com/apps-script/guides/content#redirects)). Each redirect is validated before the next request; an unknown hostname, non-default port, credentials, or malformed redirect fails closed. Do not share or log the request body, shared secret, or full URL (which can contain deployment identifiers). It never reports a saved enquiry unless Apps Script returns `saved: true` for the same ID. The frontend requires readable JSON and the matching ID before it shows success or partial success.

Configure these private environment variables for the function:

| Variable | Purpose |
| --- | --- |
| `GOOGLE_APPS_SCRIPT_URL` | Deployed Apps Script web app URL ending in `/exec` |
| `CONTACT_SHARED_SECRET` | Same secret as the Apps Script `CONTACT_SHARED_SECRET` Script Property |
| `CONTACT_ALLOWED_ORIGIN` | Exact site origin, such as `https://portfolio.example` (scheme and host only; no path or trailing slash) |

For local development, create test-only Apps Script, spreadsheet, notification email, and secret resources first. Copy `.env.example` to `.env` and replace every placeholder with those test-only values. The Netlify CLI reads local `.env` files during `netlify dev`; the checked-in `.env.example` is documentation only and is not loaded. The existing `.gitignore` excludes `.env` files and allows only `.env.example`. Use `CONTACT_ALLOWED_ORIGIN=http://localhost:8888` for the default Netlify Dev origin. Run `netlify dev` from the project root and use the local URL it prints; it serves the static site and the function at `/.netlify/functions/contact`. A basic static server and `file://` do not serve this function. Do not use production resources for an end-to-end local submission: a successful test intentionally writes a sheet row and may send a notification email.

For production, add the same three variables in the Netlify site dashboard under Project configuration > Environment variables, with scope available to Functions. Set CONTACT_ALLOWED_ORIGIN to the exact deployed site origin (scheme and host only, no trailing slash), then trigger a new deploy so the function receives updated settings. Do not copy .env into the repository or rely on it for production: Netlify deployments do not load a local .env file. JS/contact-config.js already points to the same-origin function path, so no production URL or secret belongs in frontend code. Configure the exact allowed origin separately for deploy previews if needed.

The function requires no added npm dependencies. Its in-memory IP rate limit (8 requests per 10 minutes per warm function instance) is best-effort only; serverless instances can restart or scale independently. The honeypot and exact-origin check are useful filters, not authentication. The Apps Script endpoint remains publicly reachable but requires its private shared secret. Do not use this as a substitute for stronger provider-level abuse protection if spam becomes a problem.

## Safe local testing

Do not test against the production Apps Script deployment if you must avoid sending real email or writing real enquiries. For an end-to-end local test, use a separate test spreadsheet, a test Apps Script deployment with a test notification recipient, and test-only environment values; never reuse the production secret for a test deployment. Then copy `.env.example` to `.env`, replace its placeholders with test values, start `netlify dev` at the project root, and open the local URL printed by the CLI. First test invalid payload, honeypot, missing configuration, origin rejection, and rate limiting without sending a valid request upstream. A successful end-to-end submission intentionally creates a test row and may send a test notification; only submit when those test resources are configured. No live request was made as part of this repository audit.

## Delivery behavior and retry safety

- A successful sheet write is confirmed before `MailApp.sendEmail` runs. A spreadsheet failure prevents email and returns `saved: false`.
- The script stores the enquiry first, then claims email delivery using a script lock. It records `Sent` or `Failed` after the attempt. If writing the email status fails, the saved row remains and the API reports `Unknown`/`statusUpdated: false`; the row may remain `Sending` and needs manual review.
- A duplicate `submissionId` never creates another row. If the existing row is `Pending`, one retry claims the email attempt; `Sending`, `Sent`, and `Failed` rows are not sent again automatically. No exactly-once email guarantee is made.
- On an unreadable/lost response the frontend retains the fields and reuses the ID for an unchanged retry. It stores only that ID and a SHA-256 fingerprint in session storage, not the message. Editing the enquiry creates a new ID on the next submit.
- The form does not claim success for an unconfigured endpoint, an opaque response, invalid JSON, a mismatched ID, or an unconfirmed sheet write.

## Verification checklist

Use a test spreadsheet, proxy, notification address, and secret before production.

1. **Successful enquiry:** Submit valid data. Confirm exactly one row is added, status becomes `Sent`, the proxy returns matching `submissionId` and `saved: true`, and the email arrives. MailApp accepting the send is not proof of inbox delivery.
2. **Email failure:** In a test deployment, cause the mail step to fail while leaving sheet access valid. Confirm the row remains, status becomes `Failed` where possible, no data is lost, and the UI reports saved-but-email-failed rather than full success.
3. **Spreadsheet failure:** In a test deployment, use an inaccessible/missing spreadsheet or tab. Confirm no email is attempted, the API reports `saved: false`, and the UI preserves the form values.
4. **Duplicate/retry:** Resend the exact same payload with the same ID (including simulating a lost proxy response). Confirm no second row appears and inspect the existing email status. Repeating a `Sent` or `Failed` ID must not send a second email.
5. **Validation/authentication:** Try invalid email, out-of-range lengths, unsupported subject, missing fields, a filled honeypot, and a wrong secret. Confirm no row or email is created.
6. **Browser integration:** With test resources, run `netlify dev` and test proxy preflight, redirects, readable JSON, loading state, and each UI result. Do not use the Apps Script URL as the frontend endpoint.

The proxy code and local route are configured in the repository. No environment values, spreadsheet, Apps Script deployment, Netlify site settings, live submission, email, or end-to-end integration have been configured or tested from this repository.
