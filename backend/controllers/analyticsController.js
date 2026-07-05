const Order = require('../models/Order');
const Product = require('../models/Product');

// Get market-wide category share and trends
// GET /api/analytics/market-share
// Private (Manufacturer/Admin)
exports.getMarketShare = async (req, res) => {
    try {
        // Get all completed/processing orders to determine market volume
        const orders = await Order.find({ 
            status: { $ne: 'cancelled' } 
        }).populate('items.product');

        const categorySales = {};
        let totalMarketRevenue = 0;

        orders.forEach(order => {
            order.items.forEach(item => {
                const category = item.product?.category || 'Uncategorized';
                const revenue = item.price * item.quantity;
                
                if (!categorySales[category]) {
                    categorySales[category] = {
                        revenue: 0,
                        quantity: 0,
                        manufacturerShare: {}
                    };
                }
                
                categorySales[category].revenue += revenue;
                categorySales[category].quantity += item.quantity;
                totalMarketRevenue += revenue;

                // Track individual manufacturer contribution to this category
                const mId = order.manufacturer.toString();
                if (!categorySales[category].manufacturerShare[mId]) {
                    categorySales[category].manufacturerShare[mId] = 0;
                }
                categorySales[category].manufacturerShare[mId] += revenue;
            });
        });

        // Format for frontend
        const marketData = Object.entries(categorySales).map(([category, data]) => {
            const userRevenue = data.manufacturerShare[req.user.id] || 0;
            return {
                category,
                totalRevenue: data.revenue,
                totalQuantity: data.quantity,
                userRevenue,
                marketShare: totalMarketRevenue > 0 ? (data.revenue / totalMarketRevenue) * 100 : 0,
                yourShareOfCategory: data.revenue > 0 ? (userRevenue / data.revenue) * 100 : 0
            };
        });

        res.status(200).json({
            success: true,
            data: {
                totalMarketRevenue,
                categories: marketData.sort((a, b) => b.totalRevenue - a.totalRevenue)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
