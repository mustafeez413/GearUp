const getPaymentProofTemplate = (orderId, buyerName, amount) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #eaeaec; border-radius: 8px;">
        <h2 style="color: #041B34; border-bottom: 2px solid #00C875; padding-bottom: 10px;">New Payment Proof Uploaded</h2>
        <p style="font-size: 16px; line-height: 1.5;">Hello Admin,</p>
        <p style="font-size: 16px; line-height: 1.5;">A buyer has just uploaded a payment screenshot for their order.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="margin: 5px 0;"><strong>Buyer Name:</strong> ${buyerName}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> PKR ${amount.toLocaleString()}</p>
        </div>

        <p style="font-size: 16px; line-height: 1.5;">Please review the screenshot and approve the order from the admin dashboard to proceed with the workflow.</p>
        
        <div style="margin-top: 30px; font-size: 12px; color: #888;">
            <p>This is an automated message from GearUp Marketplace. Please do not reply directly to this email.</p>
        </div>
    </div>
    `;
};

module.exports = {
    getPaymentProofTemplate
};
