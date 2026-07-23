const dotenv = require('dotenv');
// Load env vars immediately before importing any other modules/routes
dotenv.config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const aiRoutes = require('./routes/aiRoutes');
const contactRoutes = require('./routes/contactRoutes');
const chatRoutes = require('./routes/chatRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
// NOTE: analyticsRoutes (routes/analyticsRoutes.js) is intentionally not mounted.
// It exposes GET /api/analytics/market-share — enable when analytics feature is ready.

// Configure custom DNS servers for local development to avoid querySrv ECONNREFUSED issues with Node.js DNS resolver
if (process.env.NODE_ENV !== 'production') {
    const dns = require('dns');
    try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (err) {
        console.warn('[dns] Could not set custom DNS servers:', err.message);
    }
}

const { prepareGoogleCredentials } = require('./utils/prepareGoogleCredentials');
prepareGoogleCredentials();

// Connect to database and start server
const startServer = async () => {
    try {
        await connectDB();


        
        const app = express();
        
        // Enable CORS
        app.use(cors());
        
        // Mount Stripe router before global json body parsing to preserve raw webhook bodies
        const stripeRoutes = require('./routes/stripeRoutes');
        app.use('/api/stripe', stripeRoutes);
        
        const path = require('path');
        
        // Body parser — allow product payloads with metadata (images upload separately)
        app.use(express.json({ limit: '2mb' }));
        
        // Set static folder with proof protection
        app.use('/uploads', (req, res, next) => {
            if (req.url.includes('proof-') || req.url.includes('.pdf')) {
                return res.status(403).json({ success: false, error: 'Direct access to proofs is forbidden. Use the secure route.' });
            }
            next();
        }, express.static(path.join(__dirname, 'uploads')));
        
        // Mount routers
        app.use('/api/auth', authRoutes);
        app.use('/api/admin', adminRoutes);
        app.use('/api/products', productRoutes);
        app.use('/api/orders', orderRoutes);
        app.use('/api/ai', aiRoutes);
        app.use('/api/contact', contactRoutes);
        app.use('/api/chats', chatRoutes);
        app.use('/api/audit-logs', auditLogRoutes);
        app.use('/api/notifications', notificationRoutes);
        app.use('/api/banners', require('./routes/bannerRoutes'));
        app.use('/api/upload', require('./routes/uploadRoutes'));
        app.use('/api/transactions', transactionRoutes);

        app.use('/api/disputes', disputeRoutes);
        app.use('/api/ads', require('./routes/ads'));
        app.use('/api/advertisements', require('./routes/advertisementRoutes'));

        const { scheduleAdCampaignExpiryJob } = require('./jobs/adCampaignExpiryJob');
        scheduleAdCampaignExpiryJob();
        
        const { scheduleEscrowAutoReleaseJob } = require('./jobs/escrowAutoReleaseJob');
        scheduleEscrowAutoReleaseJob();
        
        // Health check route (Railway + uptime monitors)
        app.get('/api/health', (req, res) => {
            res.status(200).json({
                status: 'ok',
                success: true,
                message: 'API is running',
            });
        });
        
        const PORT = process.env.PORT || 5001;

        app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });

        // Legacy second port only for local dev (Railway/cloud assign a single PORT)
        if (process.env.NODE_ENV !== 'production' && parseInt(PORT, 10) !== 5000) {
            app.listen(5000, () => {
                console.log('Server also running on port 5000 for legacy frontend support');
            });
        }
    } catch (err) {
        console.error('Failed to start server:', err.message);
        process.exit(1);
    }
};

startServer();

