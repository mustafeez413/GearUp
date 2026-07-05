/**
 * Create or promote a platform admin user (run once against your DB).
 *
 * Usage (from backend folder):
 *   node scripts/createAdmin.js
 *
 * Optional env (defaults shown):
 *   ADMIN_EMAIL=admin@gearup.com
 *   ADMIN_PASSWORD=ChangeMe123!
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function run() {
    await connectDB();

    const email = (process.env.ADMIN_EMAIL || 'admin@gearup.com').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    if (password.length < 6) {
        console.error('ADMIN_PASSWORD must be at least 6 characters.');
        process.exit(1);
    }

    const user = await User.findOne({ email }).select('+password');
    if (user) {
        let changed = false;
        if (user.role !== 'admin') {
            user.role = 'admin';
            changed = true;
        }
        if (process.env.ADMIN_PASSWORD) {
            user.password = password;
            changed = true;
        }
        if (changed) {
            await user.save();
            console.log('Updated existing user to admin:', email);
        } else {
            console.log('Admin user already exists:', email);
        }
    } else {
        await User.create({
            name: 'Platform Admin',
            email,
            password,
            role: 'admin',
            businessDetails: {}
        });
        console.log('Admin user created:', email);
        console.log('Sign in at /admin-login with this email and password.');
    }

    await mongoose.disconnect().catch(() => {});
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
