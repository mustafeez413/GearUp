const nodemailer = require('nodemailer');
const dns = require('dns');

// Force IPv4 resolution to prevent ENETUNREACH errors on environments like Railway (prefer IPv4 over IPv6)
if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
}

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

console.log('[EmailService] SMTP credentials status:', {
    userExists: Boolean(user),
    passExists: Boolean(pass)
});

// Initialize the Nodemailer transporter with IPv4 preference (family: 4)
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services like 'smtp.mailtrap.io' for testing
    family: 4,        // Force IPv4 to prevent IPv6 ENETUNREACH issues in cloud environments like Railway
    auth: {
        user: user || '',
        pass: pass || ''
    }
});

console.log('[EmailService] Transporter initialized successfully');

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

        console.log(`[EmailService] Attempting to send email to: ${to}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[EmailService] Failed to send email to ${to}:`, {
            message: error.message,
            code: error.code,
            command: error.command,
            responseCode: error.responseCode,
            stack: error.stack,
        });
        // We do NOT throw error here because we don't want email failures to break workflows.
        return false;
    }
};

module.exports = {
    sendEmail
};

