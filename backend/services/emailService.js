const nodemailer = require('nodemailer');

// Initialize the Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services like 'smtp.mailtrap.io' for testing
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send an email using the configured transporter.
 * @param {string} to - Recipient email address
 * @param {string} subject - Subject line
 * @param {string} html - HTML body content
 */
const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('[EmailService] Email credentials not configured. Skipping email to:', to);
            return false;
        }

        const mailOptions = {
            from: `"GearUp Marketplace" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
        // We do NOT throw error here because we don't want email failures to break workflows.
        return false;
    }
};

module.exports = {
    sendEmail
};
