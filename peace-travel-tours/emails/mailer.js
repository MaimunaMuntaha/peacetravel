const nodemailer = require('nodemailer');

// Uses Gmail SMTP by default (works well for a small business with a Gmail address
// and an "App Password"). You can swap this for SendGrid, Mailgun, etc. by changing
// the transport config below — the rest of the app doesn't need to change.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const BRAND = {
  name: 'Peace Travel and Tours',
  phone: '347-288-7042',
  altPhone: '718-440-9366',
  address: '41-34, 75 Street, Suite 3A, Elmhurst, NY 11373',
  hours: 'Monday – Friday, 9:00 AM – 6:00 PM',
};

function wrapEmail(bodyHtml) {
  return `
  <div style="background:#eef5fc;padding:32px 0;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #d9e8f6;">
      <div style="background:linear-gradient(135deg,#1e5fa8,#4a90d9);padding:24px 32px;">
        <h1 style="color:#ffffff;margin:0;font-size:20px;letter-spacing:0.5px;">${BRAND.name}</h1>
        <p style="color:#dbeafe;margin:4px 0 0;font-size:13px;">Travel made simple, prices made fair.</p>
      </div>
      <div style="padding:28px 32px;color:#1a2b42;font-size:15px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="background:#f5f9fd;padding:18px 32px;font-size:12px;color:#5b7690;border-top:1px solid #e2edf7;">
        ${BRAND.address}<br/>
        ${BRAND.phone} &middot; ${BRAND.altPhone}<br/>
        ${BRAND.hours}
      </div>
    </div>
  </div>`;
}

async function sendBookingConfirmation({ toEmail, toName, booking }) {
  const tripType = booking.type === 'flight' ? 'Flight' : 'Package';
  const html = wrapEmail(`
    <p>Hi ${toName},</p>
    <p>Thank you for your ${tripType.toLowerCase()} request with <strong>${BRAND.name}</strong>. We've received the details below:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#5b7690;">Trip type</td><td style="padding:6px 0;text-align:right;font-weight:600;">${tripType}</td></tr>
      <tr><td style="padding:6px 0;color:#5b7690;">Destination</td><td style="padding:6px 0;text-align:right;font-weight:600;">${booking.destination}</td></tr>
      <tr><td style="padding:6px 0;color:#5b7690;">Departure date</td><td style="padding:6px 0;text-align:right;font-weight:600;">${booking.depart_date}</td></tr>
      <tr><td style="padding:6px 0;color:#5b7690;">Return date</td><td style="padding:6px 0;text-align:right;font-weight:600;">${booking.return_date || 'Flexible'}</td></tr>
      <tr><td style="padding:6px 0;color:#5b7690;">Trip length</td><td style="padding:6px 0;text-align:right;font-weight:600;">${booking.trip_days ? booking.trip_days + ' days' : '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#5b7690;">Passengers</td><td style="padding:6px 0;text-align:right;font-weight:600;">${booking.passengers}</td></tr>
      <tr><td style="padding:6px 0;color:#5b7690;">Class</td><td style="padding:6px 0;text-align:right;font-weight:600;">${booking.travel_class}</td></tr>
    </table>
    <p>Our team (Mahbubur Rahman) will personally review current prices and get back to you by email or phone with available options and pricing.</p>
    <p style="margin-top:20px;">Warm regards,<br/>${BRAND.name}</p>
  `);

  await transporter.sendMail({
    from: `"${BRAND.name}" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `We received your ${tripType.toLowerCase()} request — ${BRAND.name}`,
    html,
  });
}

async function sendAdminNotification({ booking, customer }) {
  if (!process.env.ADMIN_EMAIL) return; // no admin email configured, skip silently
  const tripType = booking.type === 'flight' ? 'Flight' : 'Package';
  const html = wrapEmail(`
    <p>New ${tripType.toLowerCase()} request submitted on the website:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#5b7690;">Customer</td><td style="padding:6px 0;text-align:right;font-weight:600;">${customer.name}</td></tr>
      <tr><td style="padding:6px 0;color:#5b7690;">Email</td><td style="padding:6px 0;text-align:right;font-weight:600;">${customer.email}</td></tr>
      <tr><td style="padding:6px 0;color:#5b7690;">Destination</td><td style="padding:6px 0;text-align:right;font-weight:600;">${booking.destination}</td></tr>
      <tr><td style="padding:6px 0;color:#5b7690;">Departure date</td><td style="padding:6px 0;text-align:right;font-weight:600;">${booking.depart_date}</td></tr>
      <tr><td style="padding:6px 0;color:#5b7690;">Return date</td><td style="padding:6px 0;text-align:right;font-weight:600;">${booking.return_date || 'Flexible'}</td></tr>
      <tr><td style="padding:6px 0;color:#5b7690;">Passengers</td><td style="padding:6px 0;text-align:right;font-weight:600;">${booking.passengers}</td></tr>
      <tr><td style="padding:6px 0;color:#5b7690;">Class</td><td style="padding:6px 0;text-align:right;font-weight:600;">${booking.travel_class}</td></tr>
    </table>
    <p>Log in to the admin dashboard to respond.</p>
  `);

  await transporter.sendMail({
    from: `"${BRAND.name} Website" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New ${tripType.toLowerCase()} request from ${customer.name}`,
    html,
  });
}

module.exports = { sendBookingConfirmation, sendAdminNotification };
