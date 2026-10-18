# 👨‍💻 Ayush Yadav — Developer Portfolio

A personal portfolio for presenting Salesforce development experience, skills, projects, certifications, and a downloadable résumé. The site is built as a static, multi-page website and is configured for Netlify hosting.

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Prerequisites and local setup](#prerequisites-and-local-setup)
- [Usage](#usage)
- [Configuration and environment variables](#configuration-and-environment-variables)
- [Contact form workflow](#contact-form-workflow)
- [Testing and verification](#testing-and-verification)
- [Deployment](#deployment)
- [Future improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)
- [Acknowledgements](#acknowledgements)

## Overview

The portfolio is a static website that introduces its author and provides dedicated pages for background, skills, experience, projects, certifications, résumé, and contact. Its objectives are to make this information easy to browse, provide links to project repositories and professional profiles, and offer a contact form backed by a server-side integration.

## Features

- Home page and dedicated About, Skills, Experience, Projects, Certifications, Résumé, and Contact pages.
- Responsive styling, shared navigation components, theme and animation scripts, and project imagery.
- Skills data loaded from `IMAGES/data/skills.json`.
- Résumé PDF available from the site.
- Contact submissions routed through a Netlify Function to a Google Apps Script web app, which stores enquiries in Google Sheets and attempts an email notification.

## Technology stack

| Technology | Purpose |
| --- | --- |
| HTML | Page structure and content |
| CSS | Layout, responsive styling, and visual presentation |
| Browser JavaScript | Navigation, theme, animation, skills, project links, and contact form behavior |
| JSON | Data source for the skills page |
| Netlify Functions (Node.js runtime) | Server-side contact form proxy |
| Netlify configuration (TOML) | Publish directory, function directory, and response headers |
| Google Apps Script and Google Sheets | Contact enquiry processing and storage; requires separate configuration |

The repository has no `package.json` or dependency lockfile. No frontend framework or package manager is configured.

## Project structure

```text
.
├── apps-script/
│   └── Code.gs
├── components/
│   ├── header.html
│   └── sidebar.html
├── css/                         # Page and shared stylesheets
├── IMAGES/
│   ├── data/skills.json
│   ├── project-thumbnails/      # Project card images
│   ├── LOGO.png
│   └── PROFILE.png
├── JS/                          # Browser scripts, including contact config
├── netlify/
│   └── functions/contact.js
├── pages/                       # About, skills, experience, projects, certifications, résumé, contact
├── reference/                   # Local reference material; excluded from Git
├── RESUME/
│   └── Ayush_Yadav_Salesforce_Developer_Resume.pdf
├── .env.example                 # Placeholder template for local Netlify Dev
├── .gitignore
├── CONTACT_INTEGRATION.md       # Detailed contact integration setup and behavior
├── index.html
├── netlify.toml
└── README.md
```

## Architecture

Netlify publishes the repository root as static files (`publish = "."`) and discovers serverless functions in `netlify/functions`. The HTML pages load their CSS and browser JavaScript directly; shared header and sidebar files are present under `components/`.

The contact page sends JSON to the same-origin `/.netlify/functions/contact` route. The function validates the request and configured origin, then forwards it to the configured Google Apps Script web app with the shared secret held server-side. Apps Script validates the request, saves the enquiry to the configured spreadsheet, and attempts email notification. Detailed setup, retry behavior, and operational limitations are documented in [`CONTACT_INTEGRATION.md`](CONTACT_INTEGRATION.md).

## Prerequisites and local setup

To browse the static pages, use a local static HTTP server or open `index.html` in a browser. The contact function will not run from `file://` or a basic static server.

For local development of the contact integration, install Node.js and the Netlify CLI using Netlify's documented installation method. This repository does not pin Node.js or declare a CLI dependency. From PowerShell in the project root:

```powershell
Copy-Item .env.example .env
# Edit .env and replace every placeholder with test-only integration values.
netlify dev
```

Use the local URL printed by Netlify Dev. The example origin in `.env.example` is `http://localhost:8888`; if Netlify Dev uses a different origin, set `CONTACT_ALLOWED_ORIGIN` to that exact scheme and host. Configure a test Apps Script deployment, test spreadsheet, and test notification recipient before submitting a valid form. A successful request writes a row and may send email.

## Usage

Open `index.html` through a web server or a browser to explore the portfolio. Use the navigation links to visit each section, the résumé controls to view or download the PDF, and the project cards to follow their configured project links. Use the Contact page to submit an enquiry only after its backend has been configured.

## Configuration and environment variables

`.env.example` documents the variable names needed for local Netlify Dev and contains placeholders, not usable credentials. Copy it to the ignored local `.env` file and replace the placeholders with values for test resources. Do not commit `.env`, put secrets in browser-delivered files, or use production credentials for local testing.

| Variable | Purpose |
| --- | --- |
| `GOOGLE_APPS_SCRIPT_URL` | Deployed Apps Script web app URL ending in `/exec` |
| `CONTACT_SHARED_SECRET` | Shared secret checked by Apps Script and sent only by the server-side function |
| `CONTACT_ALLOWED_ORIGIN` | Exact origin allowed by the function, including scheme and host, without a path or trailing slash |

For production, configure these values in the Netlify site's private environment variable settings, with function scope, then deploy again. Apps Script separately requires the `SPREADSHEET_ID`, `SHEET_NAME`, `NOTIFICATION_EMAIL`, and `CONTACT_SHARED_SECRET` script properties. Follow [`CONTACT_INTEGRATION.md`](CONTACT_INTEGRATION.md) for setup and safe test procedures. Never commit secrets or copy a real value into documentation.

## Contact form workflow

The browser calls the same-origin Netlify Function configured in `JS/contact-config.js`; it does not call Apps Script directly. The function validates the origin and payload, forwards the request and server-side shared secret to Apps Script, and returns the result to the browser. Apps Script checks the secret, writes and confirms the enquiry row, then attempts notification email and records its status in Google Sheets. Submission IDs support idempotent sheet writes and safe retries, but email delivery is not guaranteed exactly once. The function's in-memory rate limit is best-effort across serverless instances. See [`CONTACT_INTEGRATION.md`](CONTACT_INTEGRATION.md) for the full integration contract and limitations.

## Testing and verification

No automated test suite or test script is present in the repository. The contact integration guide includes a manual verification checklist. Run it only with separate test spreadsheet, Apps Script deployment, secret, and notification recipient; valid submissions intentionally write data and may send email. No production or end-to-end verification is implied by these instructions.

## Deployment

`netlify.toml` sets the publish directory to the repository root and the function directory to `netlify/functions`. Connect the repository to a Netlify site and deploy with those settings. Configure the three function environment variables in Netlify as described above and in [`CONTACT_INTEGRATION.md`](CONTACT_INTEGRATION.md). Deploy again after changing environment settings. The repository does not identify a live site URL, so none is listed here.

## Future improvements

These are suggestions, not existing functionality:

- Add a repeatable automated check for page links and static assets.
- Document and pin a supported Node.js version for the Netlify Function.
- Add stronger provider-level abuse controls if contact-form traffic requires them.

## Contributing

This is a personal portfolio. For a proposed correction or improvement, open an issue or pull request describing the change and its effect on the site. Preserve the existing static site structure and do not include credentials, private environment files, or local reference materials.

## License

No license has been specified in this repository. Reuse permissions should not be assumed.

## Author

**Ayush Yadav** — Salesforce Developer

- [GitHub](https://github.com/officialayushyadav15)
- [LinkedIn](https://www.linkedin.com/in/ayush-yadav-dev/)
- Email: `officialayushyadav15@gmail.com`

These profile links and contact details are present in the portfolio source.

## Acknowledgements

The site uses the Inter typeface served by Google Fonts. Portfolio content and project imagery are maintained in this repository.
