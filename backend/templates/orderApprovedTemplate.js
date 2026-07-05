const getBuyerOrderApprovedTemplate = (orderId) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #eaeaec; border-radius: 8px;">
        <h2 style="color: #041B34; border-bottom: 2px solid #00C875; padding-bottom: 10px;">Order Approved Successfully</h2>
        <p style="font-size: 16px; line-height: 1.5;">Hello,</p>
        <p style="font-size: 16px; line-height: 1.5;">Your payment for Order <strong>#${orderId}</strong> has been verified successfully.</p>
        <p style="font-size: 16px; line-height: 1.5;">Your order is now being processed by the manufacturer and you will receive another update once it ships.</p>
        
        <div style="margin-top: 30px; font-size: 12px; color: #888;">
            <p>This is an automated message from GearUp Marketplace. Please do not reply directly to this email.</p>
        </div>
    </div>
    `;
};

const getManufacturerOrderApprovedTemplate = (orderId, buyerName) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #eaeaec; border-radius: 8px;">
        <h2 style="color: #041B34; border-bottom: 2px solid #00C875; padding-bottom: 10px;">New Approved Order</h2>
        <p style="font-size: 16px; line-height: 1.5;">Hello Manufacturer,</p>
        <p style="font-size: 16px; line-height: 1.5;">A new approved order has been assigned to you.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="margin: 5px 0;"><strong>Buyer:</strong> ${buyerName}</p>
        </div>

        <p style="font-size: 16px; line-height: 1.5;">Please begin processing the shipment and update the status in your dashboard.</p>
        
        <div style="margin-top: 30px; font-size: 12px; color: #888;">
            <p>This is an automated message from GearUp Marketplace. Please do not reply directly to this email.</p>
        </div>
    </div>
    `;
};

module.exports = {
    getBuyerOrderApprovedTemplate,
    getManufacturerOrderApprovedTemplate
};
