const nodemailer = require('nodemailer');

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

  console.log('[EMAIL] SMTP config loaded', {
    hostLoaded: Boolean(host),
    userLoaded: Boolean(user),
    passLoaded: Boolean(pass),
    port,
  });

  if (!user || !pass) {
    console.error(
      '[EMAIL] Missing SMTP credentials. Expected EMAIL_USER and EMAIL_PASS (or SMTP_USER / SMTP_PASS) in environment.'
    );
    throw new Error(USER_FACING_EMAIL_ERROR);
  }

  const transporter = nodemailer.createTransport({
     host: "smtp.gmail.com",
    port: 587,
    secure: false,
   // family: 4,          
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
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
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Send attempt succeeded', {
      to: options.email,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('[EMAIL] Send attempt failed:', error.message);
    console.error('[EMAIL] Stack:', error.stack);
    throw new Error(USER_FACING_EMAIL_ERROR);
  }
};

module.exports = sendEmail;
