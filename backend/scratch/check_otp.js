const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
    email: String,
    otp: String,
    otpExpires: Date,
    isEmailVerified: Boolean
});

const User = mongoose.model('User', UserSchema);

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const user = await User.findOne({ email: 'mustafeez946@gmail.com' });
        if (user) {
            console.log('User found:', {
                email: user.email,
                hasOtp: !!user.otp,
                otp: user.otp,
                isVerified: user.isEmailVerified
            });
        } else {
            console.log('User not found');
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkUser();
