const nodemailer = require('nodemailer');
const dns = require('dns');

// Force IPv4 resolution to prevent ENETUNREACH errors on environments like Railway (prefer IPv4 over IPv6)
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const USER_FACING_EMAIL_ERROR = 'Unable to send verification email. Please try again later.';

function resolveEmailCredentials() {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER || '';
  const pass =
    process.env.EMAIL_PASS ||
    process.env.EMAIL_APP_PASSWORD ||
    process.env.SMTP_PASS ||
    '';
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const from = process.env.EMAIL_FROM || user;

  return { user, pass, host, port, from };
}

const sendEmail = async (options) => {
  const { user, pass, host, port, from } = resolveEmailCredentials();

  console.log('[EMAIL] SMTP config loaded:', {
    host,
    port,
    hostLoaded: Boolean(host),
    userLoaded: Boolean(user),
    passLoaded: Boolean(pass),
  });

  if (!user || !pass) {
    console.error(
      '[EMAIL] Missing SMTP credentials. Expected EMAIL_USER and EMAIL_PASS (or SMTP_USER / SMTP_PASS) in environment.'
    );
    throw new Error(USER_FACING_EMAIL_ERROR);
  }

  console.log('[EMAIL] Creating transporter with IPv4 preference (family: 4 and custom DNS lookup)...');
  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465,
    family: 4, // Force IPv4 to prevent IPv6 ENETUNREACH issues in cloud environments like Railway
    lookup: (hostname, options, callback) => {
      options.family = 4;
      return dns.lookup(hostname, options, callback);
    },
    auth: {
      user: user,
      pass: pass
    },
  });

  console.log('[EMAIL] Transporter created successfully');

  const mailOptions = {
    from: `"GearUp Support" <${from}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  try {
    console.log('[EMAIL] Attempting to send email to:', options.email);
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Send attempt succeeded', {
      to: options.email,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('[EMAIL] Send attempt failed:', {
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      stack: error.stack,
    });
    throw new Error(USER_FACING_EMAIL_ERROR);
  }
};

module.exports = sendEmail;

