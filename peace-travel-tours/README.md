# Peace Travel and Tours — Website

A complete booking-inquiry website for Peace Travel and Tours (Elmhurst, Queens NY):
customers create an account, choose **Flight** or **Package**, fill in their dates,
destination, class, passengers and trip length, and submit. They immediately get a
confirmation email; the business owner gets notified and can log in to an admin
dashboard to review requests and reply once real prices are ready.

## What's included

- **Public site** (`/`) — services, about, contact, sky-blue branded design
- **Customer accounts** — register / log in / log out (secure password hashing, sessions)
- **Booking form** (`/dashboard.html`) — toggle between Flight and Package, collects:
  destination, origin (flights), departure/return dates, trip length in days,
  number of passengers, travel class, and notes
- **Automatic emails** — a confirmation email to the customer, and a notification
  email to the business owner, sent the moment a request is submitted
- **Admin dashboard** (`/admin.html`) — the owner logs in and sees every request,
  can mark it Pending / Quoted / Closed, and leave a reply note the customer sees
  on their own dashboard
- **Database** — SQLite (a single file, no external database server needed)

## 1. Install

You'll need [Node.js](https://nodejs.org) 18 or newer installed on your computer or server.

```bash
cd peace-travel-tours
npm install
```

## 2. Configure your settings

Copy the example environment file and fill in real values:

```bash
cp .env.example .env
```

Open `.env` in any text editor and set:

- `SESSION_SECRET` — any long random string (used to keep logins secure)
- `EMAIL_USER` / `EMAIL_PASS` — the email account the site sends from (see below)
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` — the business owner's login and the
  address that gets notified of new requests

### Setting up the sending email (Gmail example)

The simplest option is a Gmail account:

1. Create or use a Gmail address for the business (e.g. `peacetraveltoursny@gmail.com`).
2. Turn on **2-Step Verification** on that Google account (Google Account → Security).
3. Under Security → **App passwords**, create one for "Mail" — Google gives you a
   16-character password.
4. Put that Gmail address in `EMAIL_USER` and the 16-character app password (not the
   normal Gmail password) in `EMAIL_PASS`.

If you'd rather use a transactional email service (SendGrid, Mailgun, Amazon SES,
etc.) instead of Gmail, update the `SMTP_HOST` / `SMTP_PORT` values and credentials
in `.env` — the rest of the app doesn't need to change.

## 3. Create the owner's admin login

This creates Mahbubur's login for the admin dashboard, using the `ADMIN_*` values
from your `.env` file:

```bash
npm run seed:admin
```

You can re-run this any time to change the admin password.

## 4. Run it

```bash
npm start
```

Then open **http://localhost:3000** in a browser. Log in at `/login.html` with the
admin email/password to see the admin dashboard at `/admin.html`; anyone else can
register a free account and submit a request from `/dashboard.html`.

For development (auto-restarts when you edit files):

```bash
npm run dev
```

## 5. Putting it online

This is a normal Node.js app, so it runs on almost any host. Simple options that
work well for a small business site:

- **Render** (render.com) — free tier available, connects directly to a GitHub repo,
  set the environment variables in its dashboard, "Start command" is `npm start`.
- **Railway** (railway.app) — similar to Render, very quick to deploy from GitHub.
- A **VPS** (DigitalOcean, Linode, etc.) — install Node, copy the files up, run
  `npm install && npm run seed:admin && npm start` (use a process manager like
  `pm2` to keep it running, e.g. `pm2 start server.js`).

Whichever host you choose:
1. Push this project to a GitHub repository (the `.gitignore` already excludes
   `.env` and the database file, so secrets won't be committed).
2. Set the same environment variables from your `.env` file in the host's dashboard.
3. Run `npm run seed:admin` once (most hosts let you run a one-off command, or you
   can run it locally against the same database before deploying).
4. Point your domain (e.g. `peacetravelandtours.com`) at the host — most hosts give
   you simple instructions for this once your site is deployed.

## Project structure

```
peace-travel-tours/
├── server.js              Main Express server + session setup
├── db/
│   ├── database.js        SQLite schema (users, bookings, sessions)
│   ├── seedAdmin.js        Script to create/update the owner's admin login
│   └── sqliteSessionStore.js
├── routes/
│   ├── auth.js             Register / login / logout / session check
│   ├── bookings.js         Customers submit + view their own requests
│   └── admin.js            Owner views all requests, updates status/reply
├── middleware/auth.js       Login/admin route protection
├── emails/mailer.js         Confirmation + notification emails (nodemailer)
└── public/                  All the pages customers and the owner see
    ├── index.html            Home / marketing page
    ├── login.html / register.html
    ├── dashboard.html         Customer's booking form + their request history
    ├── admin.html             Owner's dashboard
    ├── css/style.css          Shared sky-blue design system
    └── js/                    Page logic (fetch calls to the API above)
```

## Notes on data

Everything is stored in a single SQLite file at `db/peace_travel.db`, created the
first time you run the app. Back this file up periodically (it's just one file to
copy) since it holds every customer account and every booking request.

## Support

Business info baked into the site:
- Peace Travel and Tours, 41-34, 75 Street, Suite 3A, Elmhurst, NY 11373
- 347-288-7042 · 718-440-9366 · Mon–Fri 9am–6pm
- Contact: Mahbubur Rahman, CEO
