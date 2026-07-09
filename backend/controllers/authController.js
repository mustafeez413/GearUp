const User = require('../models/User');
const { getOrCreateWallet } = require('../services/walletService');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '373271456084-6flk0m1dvv2j8fipt5m787vt5jg8cv2c.apps.googleusercontent.com');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { validateRegistrationPayload } = require('../utils/registrationValidation');
const { serializeUserForClient } = require('../utils/userAvatar');
const { uploadToCloudinary, deleteFromUrl } = require('../utils/cloudinary');

const ALLOWED_BUSINESS_DOCUMENT_MIMES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const ALLOWED_BUSINESS_DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

function validateUploadedBusinessDocument(file) {
    if (!file) {
        return 'Please upload your NTN Registration Document before continuing.';
    }

    const extension = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_BUSINESS_DOCUMENT_EXTENSIONS.includes(extension) || !ALLOWED_BUSINESS_DOCUMENT_MIMES.has(file.mimetype)) {
        return 'Please upload a valid PDF, JPG, JPEG, or PNG file.';
    }

    return '';
}

// Register user
// POST /api/auth/register
// Public
exports.register = async (req, res, next) => {
    try {
        console.log('[register] incoming request', {
            email: req.body?.email,
            city: req.body?.city,
            province: req.body?.province,
        });

        const validation = validateRegistrationPayload(req.body);
        if (!validation.isValid) {
            console.log('[register] validation failed', validation.error);
            return res.status(400).json({ success: false, error: validation.error });
        }

        const {
            name,
            email,
            password,
            role,
            businessName,
            phone,
            shopNumber,
            street,
            area,
            city,
            province,
            agreedToTerms,
        } = validation.sanitized;

        // Check if user already exists (email or phone)
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, error: 'Email already registered' });
        }

        if (phone) {
            const phoneExists = await User.findOne({ 'businessDetails.phone': phone });
            if (phoneExists) {
                return res.status(400).json({ success: false, error: 'Phone number already registered' });
            }
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Create user
        const userData = {
            name,
            email,
            password,
            role,
            otp,
            otpExpires,
            agreedToTerms,
            verificationStatus: role === 'admin' ? 'approved' : (role === 'manufacturer' ? 'business_required' : 'approved'),
            businessDetails: {
                businessName,
                phone,
                shopNumber,
                street,
                area,
                city,
                province,
                sellerType: role === 'manufacturer' ? 'manufacturer' : (role === 'wholesaler' ? 'wholesaler' : 'none')
            }
        };

        const user = await User.create(userData);
        console.log('[register] user created', { id: user._id, email: user.email });

        // Send OTP via email
        const message = `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #10B981;">Welcome to GearUp!</h2>
                <p>Thank you for registering. Please use the following OTP to verify your email address:</p>
                <div style="background: #F3F4F6; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; border-radius: 8px;">
                    ${otp}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
            </div>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'GearUp Email Verification',
                html: message
            });
        } catch (err) {
            console.error('Email send failed:', err);
            // We don't stop registration if email fails, but we should inform user later
        }

        sendTokenResponse(user, 201, res);
    } catch (error) {
        console.error('[register] error', error.stack || error.message);
        if (error.name === 'ValidationError' && error.errors) {
            const firstFieldError = Object.values(error.errors)[0];
            return res.status(400).json({ success: false, error: firstFieldError.message });
        }
        res.status(400).json({ success: false, error: error.message });
    }
};

// Verify Email OTP
// POST /api/auth/verify-email
// Public
exports.verifyEmail = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, error: 'Please provide email and OTP' });
        }

        const user = await User.findOne({ email }).select('+otp +otpExpires');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ success: false, error: 'Email already verified' });
        }

        // Check if OTP matches and is not expired
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
        }

        // Mark as verified
        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: true,
                verificationStatus: user.verificationStatus
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Resend OTP
// POST /api/auth/resend-otp
// Public
exports.resendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, error: 'Please provide email' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ success: false, error: 'Email already verified' });
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000;

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Send Email
        const message = `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #10B981;">New Verification Code</h2>
                <p>Your new GearUp verification code is:</p>
                <div style="background: #F3F4F6; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; border-radius: 8px;">
                    ${otp}
                </div>
                <p>This code will expire in 10 minutes.</p>
            </div>
        `;

        await sendEmail({
            email: user.email,
            subject: 'New Verification Code - GearUp',
            html: message
        });

        res.status(200).json({
            success: true,
            message: 'OTP resent successfully'
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Login user
// POST /api/auth/login
// Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide an email and password' });
        }

        console.log(`[AUTH] Attempting login for: ${email}`);
        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log(`[AUTH] User not found: ${email}`);
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);
        console.log(`[AUTH] Password match result: ${isMatch}`);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Logout user / clear cookie
// GET /api/auth/logout
// Public
exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({ success: true, data: {} });
};

// Get all manufacturers
// GET /api/auth/manufacturers
// Public
exports.getManufacturers = async (req, res, next) => {
    try {
        const query = {};

        if (req.query.role === 'manufacturer') {
            query.role = 'manufacturer';
        } else if (req.query.role === 'wholesaler') {
            query.role = 'wholesaler';
        } else {
            query.$or = [{ role: 'manufacturer' }, { role: 'wholesaler' }];
        }

        if (req.query.verified === 'true') {
            query.$and = [
                ...(query.$and || []),
                {
                    $or: [
                        { verificationStatus: 'approved' },
                        { verificationStatus: 'verified' },
                        { 'businessDetails.isVerified': true }
                    ]
                }
            ];
        }

        if (req.user) {
            query._id = { $ne: req.user.id };
        }

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Submit business verification documents
// PUT /api/auth/verify-business
// Private
exports.submitVerification = async (req, res, next) => {
    try {
        const documentError = validateUploadedBusinessDocument(req.file);
        if (documentError) {
            return res.status(400).json({ success: false, error: documentError });
        }

                const { taxId, address, phone, website, city, sellerType } = req.body;

        // Delete old license if exists
        const userBefore = await User.findById(req.user.id);
        if (userBefore && userBefore.businessDetails?.businessLicense) {
            await deleteFromUrl(userBefore.businessDetails.businessLicense);
        }

        // Upload new license to Cloudinary
        const uploadResult = await uploadToCloudinary(req.file.buffer, 'documents');
        const businessLicense = uploadResult.secure_url;

        const updateData = {
            'businessDetails.taxId': taxId,
            'businessDetails.address': address,
            'businessDetails.phone': phone,
            'businessDetails.website': website,
            'businessDetails.city': city,
            'businessDetails.businessLicense': businessLicense,
        };

        const requesterRole = req.user.role;
        if (sellerType || requesterRole === 'wholesaler') {
            updateData['businessDetails.sellerType'] = requesterRole === 'wholesaler' ? 'wholesaler' : sellerType;
        }

        // Set pending status atomically — avoids failed secondary save leaving business_required
        updateData.verificationStatus = 'pending';
        updateData.verificationSubmittedAt = new Date();
        updateData['businessDetails.isVerified'] = false;

        const user = await User.findByIdAndUpdate(req.user.id, updateData, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// GET /api/auth/verification-document
// Private — secure access to the authenticated user's submitted verification file
exports.getVerificationDocument = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('businessDetails.businessLicense');
        const licensePath = user?.businessDetails?.businessLicense;

        if (!licensePath) {
            return res.status(404).json({ success: false, error: 'No verification document found.' });
        }

        // If it's a Cloudinary URL, redirect to it
        if (licensePath.startsWith('http')) {
            return res.redirect(licensePath);
        }

        const filename = path.basename(licensePath);
        if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ success: false, error: 'Invalid document reference.' });
        }

        const filePath = path.resolve(__dirname, '..', 'uploads', filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: 'Verification document file not found.' });
        }

        const extension = path.extname(filename).toLowerCase();
        const mimeByExtension = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
        };

        if (mimeByExtension[extension]) {
            res.type(mimeByExtension[extension]);
        }

        res.setHeader('Content-Disposition', `inline; filename="${filename.replace(/"/g, '')}"`);
        res.sendFile(filePath);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Update production capacity
// PUT /api/auth/capacity
// Private (Manufacturer)
exports.updateCapacity = async (req, res, next) => {
    try {
        const { productionCapacity } = req.body;

        if (productionCapacity === undefined) {
            return res.status(400).json({ success: false, error: 'Please provide production capacity' });
        }

        const user = await User.findById(req.user.id);

        if (!user || user.role !== 'manufacturer') {
            return res.status(403).json({ success: false, error: 'Only manufacturers can update capacity' });
        }

        user.businessDetails.productionCapacity = productionCapacity;
        await user.save();

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Get single user profile
// GET /api/auth/user/:id
// Public
exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Get current authenticated user
// GET /api/auth/me
// Private
exports.getCurrentUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        console.log("Fetched user profile:", user);

        res.status(200).json({ success: true, data: serializeUserForClient(user) });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Forgot password
// POST /api/auth/forgotpassword
// Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ success: false, error: 'There is no user with that email' });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset url
        // In development, we use localhost:3000. In production, we use the FRONTEND_URL environment variable or fallback to the current host.
        const protocol = req.protocol === 'https' ? 'https' : 'http';
        const host = req.get('host').includes('localhost') ? 'localhost:3000' : req.get('host');
        const frontendUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;
        const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${resetToken}`;

        const message = `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #10B981; text-align: center;">Password Reset Request</h2>
                <p>You are receiving this email because you (or someone else) has requested a password reset for your GearUp account.</p>
                <p>Please click the button below to reset your password. This link will expire in 10 minutes.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #10B981; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset My Password</a>
                </div>
                <p style="font-size: 12px; color: #666;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 10px; color: #999; text-align: center;">&copy; 2026 GearUp. All rights reserved.</p>
            </div>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Request - GearUp',
                html: message
            });

            res.status(200).json({ success: true, data: 'Email sent' });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ success: false, error: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Reset password
// PUT /api/auth/resetpassword/:resettoken
// Public
exports.resetPassword = async (req, res, next) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid or expired token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Change password (authenticated)
// PUT /api/auth/change-password
// Private
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'Please provide current password and new password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Block Google-only users who don't have a local password
        if (user.authProvider === 'google' && !user.password) {
            return res.status(400).json({ success: false, error: 'Google-authenticated accounts cannot change password here. Please use Google account settings.' });
        }

        // Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Current password is incorrect' });
        }

        // Set new password (pre-save hook will hash it)
        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Update user profile
// PUT /api/auth/profile
// Private
exports.updateProfile = async (req, res, next) => {
    try {
        let businessDetails = req.body.businessDetails;
        if (typeof businessDetails === 'string') {
            try {
                businessDetails = JSON.parse(businessDetails);
            } catch (e) {
                // Ignore invalid JSON format
            }
        }

        let paymentDetails = req.body.paymentDetails;
        if (typeof paymentDetails === 'string') {
            try {
                paymentDetails = JSON.parse(paymentDetails);
            } catch (e) {
                // Ignore invalid JSON format
            }
        }

        const fieldsToUpdate = {
            name: req.body.name,
            businessDetails: businessDetails
        };

        if (req.body.email) {
            const newEmail = req.body.email.toLowerCase().trim();
            fieldsToUpdate.email = newEmail;
            
            const emailExists = await User.findOne({ 
                email: newEmail, 
                _id: { $ne: req.user._id } 
            });
            
            if (emailExists) {
                return res.status(400).json({ success: false, error: 'EMAIL ALREADY IN USE BY ANOTHER ACCOUNT' });
            }
        }

        if (paymentDetails) {
            fieldsToUpdate.paymentDetails = paymentDetails;
        }

        if (req.file) {
            // Delete old avatar if exists
            const userBefore = await User.findById(req.user.id);
            if (userBefore && userBefore.avatar) {
                await deleteFromUrl(userBefore.avatar);
            }
            // Upload new avatar to Cloudinary
            const uploadResult = await uploadToCloudinary(req.file.buffer, 'avatars');
            fieldsToUpdate.avatar = uploadResult.secure_url;
        } else if (req.body.removeAvatar === 'true') {
            const userBefore = await User.findById(req.user.id);
            if (userBefore && userBefore.avatar) {
                await deleteFromUrl(userBefore.avatar);
            }
            fieldsToUpdate.avatar = '';
        }

        const user = await User.findByIdAndUpdate(req.user.id, { $set: fieldsToUpdate }, {
            new: true,
            runValidators: false
        });

        res.status(200).json({
            success: true,
            data: serializeUserForClient(user)
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Google Auth
// POST /api/auth/google
// Public
exports.googleAuth = async (req, res, next) => {
    try {
        const { token, role } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, error: 'Google token is required' });
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID || '373271456084-6flk0m1dvv2j8fipt5m787vt5jg8cv2c.apps.googleusercontent.com',
        });
        const payload = ticket.getPayload();
        
        const { sub: googleId, email, name, picture } = payload;

        let user = await User.findOne({ email });

        if (user) {
            // User exists, but might have signed up with email/password previously
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
            sendTokenResponse(user, 200, res);
        } else {
            // New user registration via Google
            const defaultRole = role || 'wholesaler';
            user = await User.create({
                name,
                email,
                googleId,
                authProvider: 'google',
                role: defaultRole,
                avatar: picture,
                isEmailVerified: true,
                verificationStatus: defaultRole === 'manufacturer' ? 'business_required' : 'approved'
            });
            sendTokenResponse(user, 201, res);
        }
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(400).json({ success: false, error: 'Failed to authenticate with Google' });
    }
};

// @desc    Accept platform policies after first login
// @route   PUT /api/auth/accept-policies
// @access  Private
exports.acceptPolicies = async (req, res, next) => {
    // TEMP_DISABLED_TERMS_GATE
    return res.status(200).json({
        success: true,
        bypassed: true,
        message: 'Policies validation bypassed successfully'
    });

    /*
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.acceptedPolicies = true;
        user.acceptedPoliciesAt = Date.now();
        await user.save();

        // Log the acceptance
        const PolicyAcceptanceLog = require('../models/PolicyAcceptanceLog');
        await PolicyAcceptanceLog.create({
            user: user._id,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.status(200).json({
            success: true,
            message: 'Policies accepted successfully',
            data: {
                acceptedPolicies: user.acceptedPolicies,
                acceptedPoliciesAt: user.acceptedPoliciesAt
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
    */
};

const sendTokenResponse = async (user, statusCode, res) => {
    try {
        await getOrCreateWallet(user._id, user.role);
    } catch (walletErr) {
        console.error('[wallet] ensure on login:', walletErr.message);
    }

    // Create token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true
    };

    const verificationStatus = user.verificationStatus || (user.businessDetails?.isVerified ? 'approved' : 'pending');
    const serialized = serializeUserForClient(user);

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: serialized._id || user._id,
                name: serialized.name,
                email: serialized.email,
                role: serialized.role,
                isEmailVerified: serialized.isEmailVerified,
                verificationStatus,
                avatar: serialized.avatar || null,
                businessDetails: serialized.businessDetails || {},
                paymentDetails: serialized.paymentDetails || {},
                acceptedPolicies: serialized.acceptedPolicies,
                acceptedPoliciesAt: serialized.acceptedPoliciesAt,
                isBlocked: !!serialized.isBlocked,
                blockReason: serialized.blockReason || ''
            }
        });
};
