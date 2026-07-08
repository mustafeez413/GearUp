const USER_FACING_EMAIL_ERROR = 'Unable to send verification email. Please try again later.';

const sendEmail = async (options) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  console.log('[EMAIL] Attempting to send email to:', options.email, 'using Resend API');

  if (!apiKey) {
    console.error('[EMAIL] Missing RESEND_API_KEY in environment variables.');
    throw new Error(USER_FACING_EMAIL_ERROR);
  }

  const mailOptions = {
    from: from,
    to: [options.email],
    subject: options.subject,
    html: options.html,
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(mailOptions),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[EMAIL] Resend API error response:', data);
      throw new Error(data.message || `HTTP error ${response.status}`);
    }

    console.log('[EMAIL] Send attempt succeeded via Resend', {
      to: options.email,
      id: data.id,
    });
  } catch (error) {
    console.error('[EMAIL] Send attempt failed:', error.message);
    console.error('[EMAIL] Stack:', error.stack);
    throw new Error(USER_FACING_EMAIL_ERROR);
  }
};

module.exports = sendEmail;
