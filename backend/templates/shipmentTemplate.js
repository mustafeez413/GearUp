const getShipmentTemplate = (orderId) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #eaeaec; border-radius: 8px;">
        <h2 style="color: #041B34; border-bottom: 2px solid #00C875; padding-bottom: 10px;">Order Shipped</h2>
        <p style="font-size: 16px; line-height: 1.5;">Hello,</p>
        <p style="font-size: 16px; line-height: 1.5;">Great news! Your order <strong>#${orderId}</strong> has been shipped successfully by the manufacturer.</p>
        <p style="font-size: 16px; line-height: 1.5;">Please check your dashboard for shipment updates and tracking information.</p>
        
        <div style="margin-top: 30px; font-size: 12px; color: #888;">
            <p>This is an automated message from GearUp Marketplace. Please do not reply directly to this email.</p>
        </div>
    </div>
    `;
};

module.exports = {
    getShipmentTemplate
};
