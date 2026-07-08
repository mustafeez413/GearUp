/**
 * Send an email using Resend API.
 * @param {string} to - Recipient email address
 * @param {string} subject - Subject line
 * @param {string} html - HTML body content
 */
const sendEmail = async (to, subject, html) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    try {
        if (!apiKey) {
            console.warn('[EmailService] RESEND_API_KEY not configured. Skipping email to:', to);
            return false;
        }

        const mailOptions = {
            from: from,
            to: [to],
            subject: subject,
            html: html
        };

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(mailOptions)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[EmailService] Resend API error response:', data);
            return false;
        }

        console.log(`[EmailService] Email sent successfully to ${to} via Resend. ID: ${data.id}`);
        return true;
    } catch (error) {
        console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
        return false;
    }
};

module.exports = {
    sendEmail
};
