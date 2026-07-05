require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

async function testUpgrade() {
    console.log('=== STARTING B2B WHOLESALE UPGRADE VERIFICATION ===');
    await connectDB();

    // 1. Setup Test Users
    console.log('\n--- 1. Setting up Test Users ---');
    
    // Find or create admin
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
        admin = await User.create({
            name: 'Platform Admin',
            email: 'admin_test@gearup.com',
            password: 'testpassword123',
            role: 'admin',
            businessDetails: {}
        });
        console.log('Created test admin.');
    } else {
        console.log('Found existing admin:', admin.email);
    }

    // Find or create Seller A (Manufacturer)
    let sellerA = await User.findOne({ email: 'seller_a@gearup.com' });
    if (!sellerA) {
        sellerA = await User.create({
            name: 'Apex Sports Mfg',
            email: 'seller_a@gearup.com',
            password: 'testpassword123',
            role: 'manufacturer',
            businessDetails: {
                companyName: 'Apex Sports Mfg',
                city: 'Sialkot',
                province: 'Punjab',
                yearsInOperation: 5,
                isVerified: true
            }
        });
        console.log('Created Seller A (Manufacturer).');
    } else {
        console.log('Found existing Seller A:', sellerA.email);
    }

    // Find or create Seller B (Verified Wholesaler Reseller)
    let sellerB = await User.findOne({ email: 'seller_b@gearup.com' });
    if (!sellerB) {
        sellerB = await User.create({
            name: 'Sialkot Gear Resellers',
            email: 'seller_b@gearup.com',
            password: 'testpassword123',
            role: 'wholesaler',
            businessDetails: {
                companyName: 'Sialkot Gear Resellers',
                city: 'Lahore',
                province: 'Punjab',
                yearsInOperation: 3,
                isVerified: true // MUST be verified to sell
            }
        });
        console.log('Created Seller B (Verified Wholesaler Reseller).');
    } else {
        // Ensure isVerified is true
        sellerB.businessDetails.isVerified = true;
        await sellerB.save();
        console.log('Found existing Seller B:', sellerB.email);
    }

    // Find or create Buyer (Wholesaler Buyer)
    let buyer = await User.findOne({ email: 'buyer_test@gearup.com' });
    if (!buyer) {
        buyer = await User.create({
            name: 'Lahore Retail & Wholesale',
            email: 'buyer_test@gearup.com',
            password: 'testpassword123',
            role: 'wholesaler',
            businessDetails: {
                companyName: 'Lahore Retail & Wholesale',
                city: 'Lahore',
                province: 'Punjab',
                yearsInOperation: 2,
                isVerified: false
            }
        });
        console.log('Created Wholesaler Buyer.');
    } else {
        console.log('Found existing Buyer:', buyer.email);
    }

    // 2. Setup Test Products
    console.log('\n--- 2. Setting up Test Products ---');
    
    // Clear previous test products to ensure clean states
    await Product.deleteMany({ name: { $in: ['Test Cricket Balls (Box)', 'Test Footballs (Carton)'] } });

    const productA = await Product.create({
        name: 'Test Cricket Balls (Box)',
        description: 'Match grade leather cricket balls in bulk box packaging.',
        price: 5000, // price per Box
        category: 'Cricket',
        stock: 200,
        moq: 10,
        packagingType: 'Box',
        manufacturer: sellerA._id
    });
    console.log('Created Product A (owned by Manufacturer Seller A, packaging: Box)');

    const productB = await Product.create({
        name: 'Test Footballs (Carton)',
        description: 'Thermo bonded footballs in bulk carton packaging.',
        price: 12000, // price per Carton
        category: 'Football',
        stock: 100,
        moq: 5,
        packagingType: 'Carton',
        manufacturer: sellerB._id
    });
    console.log('Created Product B (owned by Verified Wholesaler Seller B, packaging: Carton)');

    // 3. Import controllers and mock req/res to test order creation
    console.log('\n--- 3. Testing Order Creation Validations ---');
    const orderController = require('../controllers/orderController');

    // Helper to create mocked express objects
    const makeMockRes = () => {
        const res = {};
        res.status = (code) => {
            res.statusCode = code;
            return res;
        };
        res.json = (data) => {
            res.jsonData = data;
            return res;
        };
        return res;
    };

    // Validation Test Case 3.1: Incorrect city spelling
    console.log('\n* Test 3.1: Incorrect City Spelling Validation ("Rawalpundi")');
    let req = {
        user: { id: buyer._id },
        body: {
            items: [
                { product: productA._id, quantity: 15 },
                { product: productB._id, quantity: 8 }
            ],
            shippingAddress: {
                houseShopNumber: 'Shop 104',
                street: 'Commercial St',
                areaSector: 'Saddar',
                city: 'Rawalpundi', // Invalid spelling
                province: 'Punjab',
                contactNumber: '03001234567'
            },
            paymentProofUrl: '/uploads/receipt-123.png'
        }
    };
    let res = makeMockRes();
    await orderController.createOrder(req, res);
    console.log('Response Status:', res.statusCode);
    console.log('Response Data:', res.jsonData);
    if (res.statusCode === 400 && res.jsonData.error.includes('Invalid city spelling')) {
        console.log('>> PASS: Correctly rejected "Rawalpundi".');
    } else {
        console.log('>> FAIL: City spelling validation failed.');
    }

    // Validation Test Case 3.2: Islamabad Sector Missing
    console.log('\n* Test 3.2: Islamabad Address Sector Requirement Validation');
    req.body.shippingAddress.city = 'Islamabad';
    req.body.shippingAddress.areaSector = 'Near Centaurus Mall'; // No sector like G-11 or F-8
    res = makeMockRes();
    await orderController.createOrder(req, res);
    console.log('Response Status:', res.statusCode);
    console.log('Response Data:', res.jsonData);
    if (res.statusCode === 400 && res.jsonData.error.includes('Islamabad addresses must specify a valid Sector')) {
        console.log('>> PASS: Correctly rejected Islamabad address without sector.');
    } else {
        console.log('>> FAIL: Islamabad sector requirement validation failed.');
    }

    // Validation Test Case 3.3: Phone digits validation (contains letters)
    console.log('\n* Test 3.3: Phone Number Format Validation (letters)');
    req.body.shippingAddress.city = 'Lahore';
    req.body.shippingAddress.areaSector = 'Gulberg';
    req.body.shippingAddress.contactNumber = '0300-123a56'; // Invalid format
    res = makeMockRes();
    await orderController.createOrder(req, res);
    console.log('Response Status:', res.statusCode);
    console.log('Response Data:', res.jsonData);
    if (res.statusCode === 400 && res.jsonData.error.includes('numeric digits only')) {
        console.log('>> PASS: Correctly rejected non-numeric phone number.');
    } else {
        console.log('>> FAIL: Phone digit numeric-only validation failed.');
    }

    // Validation Test Case 3.4: Phone length validation
    console.log('\n* Test 3.4: Phone Number Length Validation');
    req.body.shippingAddress.contactNumber = '0300123'; // Too short
    res = makeMockRes();
    await orderController.createOrder(req, res);
    console.log('Response Status:', res.statusCode);
    console.log('Response Data:', res.jsonData);
    if (res.statusCode === 400 && res.jsonData.error.includes('valid length')) {
        console.log('>> PASS: Correctly rejected short phone number.');
    } else {
        console.log('>> FAIL: Phone length validation failed.');
    }

    // Validation Test Case 3.5: Mandatory payment proof missing
    console.log('\n* Test 3.5: Mandatory Payment Proof Upload Validation');
    req.body.shippingAddress.contactNumber = '03001234567'; // Valid phone
    req.body.paymentProofUrl = ''; // Empty payment proof
    res = makeMockRes();
    await orderController.createOrder(req, res);
    console.log('Response Status:', res.statusCode);
    console.log('Response Data:', res.jsonData);
    if (res.statusCode === 400 && res.jsonData.error.includes('payment receipt upload is mandatory')) {
        console.log('>> PASS: Correctly blocked order without payment proof receipt.');
    } else {
        console.log('>> FAIL: Payment proof verification failed.');
    }

    // 4. Test Successful Multi-Seller Checkout & Order Splitting
    console.log('\n--- 4. Testing Multi-Seller Checkout & Order Splitting ---');
    req.body.paymentProofUrl = '/uploads/proof-receipt-abc.jpg';
    res = makeMockRes();
    await orderController.createOrder(req, res);
    console.log('Response Status:', res.statusCode);
    
    if (res.statusCode === 201 && res.jsonData.success) {
        console.log('>> PASS: Order successfully placed.');
        const masterOrderData = res.jsonData.data;
        console.log('Master Order ID:', masterOrderData._id);
        console.log('Master Order isMaster:', masterOrderData.isMaster);
        console.log('Master Order Sub-orders count:', masterOrderData.subOrders.length);
        console.log('Master Order Items (Combined):', masterOrderData.items.map(i => `${i.name} (${i.quantity} ${i.packagingType}s)`));

        // Fetch suborders from database to verify splits, netEarnings, and platform fees
        const subOrdersFromDb = await Order.find({ parentOrder: masterOrderData._id });
        console.log(`Found ${subOrdersFromDb.length} sub-orders in DB.`);

        for (const sub of subOrdersFromDb) {
            console.log(`\n- Sub-Order #${sub._id} -`);
            console.log(`  Seller (Manufacturer/Wholesaler): ${sub.manufacturer}`);
            console.log(`  Items:`, sub.items.map(i => `${i.name} (${i.quantity} ${i.packagingType}s @ PKR ${i.price})`));
            console.log(`  Total Gross Amount: PKR ${sub.totalAmount}`);
            console.log(`  Platform Fee (1.5% deducted from seller): PKR ${sub.platformFee}`);
            console.log(`  Net Seller Earnings: PKR ${sub.netEarnings}`);

            // Assert fee calculation: platformFee = round(totalAmount * 0.015)
            const expectedFee = Math.round(sub.totalAmount * 0.015 * 100) / 100;
            const expectedEarnings = sub.totalAmount - expectedFee;
            if (sub.platformFee === expectedFee && sub.netEarnings === expectedEarnings) {
                console.log(`  >> PASS: Fee calculation matches. platformFee (${sub.platformFee}) and netEarnings (${sub.netEarnings}) are correct.`);
            } else {
                console.log(`  >> FAIL: Fee calculation discrepancy! Expected fee: ${expectedFee}, earnings: ${expectedEarnings}`);
            }
        }

        // Test B2B Status Transition Guard (Blocked status upgrade without verification)
        console.log('\n--- 5. Testing Status Transition Guards & Verification Workflow ---');
        const subOrderToTransition = subOrdersFromDb[0];
        console.log(`Initial Sub-Order Status: "${subOrderToTransition.status}"`);

        // Test Case 5.1: Seller attempts to transition directly to 'Processing' (blocked)
        console.log('\n* Test 5.1: Transition from "Payment Submitted" to "Processing" (Should fail)');
        let transitionReq = {
            params: { id: subOrderToTransition._id },
            body: { status: 'Processing' },
            user: { id: subOrderToTransition.manufacturer.toString(), role: 'manufacturer' } // Authenticated as seller
        };
        let transitionRes = makeMockRes();
        await orderController.updateOrderStatus(transitionReq, transitionRes);
        console.log('Response Status:', transitionRes.statusCode);
        console.log('Response Data:', transitionRes.jsonData);
        if (transitionRes.statusCode === 400 && transitionRes.jsonData.error.includes('blocked until payment verification is approved')) {
            console.log('>> PASS: Correctly blocked transition to "Processing" before verification.');
        } else {
            console.log('>> FAIL: Seller was able to process unverified order!');
        }

        // Test Case 5.2: Admin approves payment (Transitions to 'Verified')
        console.log('\n* Test 5.2: Admin transitions Master Order to "Verified" (Should succeed)');
        let adminTransitionReq = {
            params: { id: masterOrderData._id },
            body: { status: 'Verified' },
            user: { id: admin._id.toString(), role: 'admin' } // Authenticated as Admin
        };
        let adminTransitionRes = makeMockRes();
        await orderController.updateOrderStatus(adminTransitionReq, adminTransitionRes);
        console.log('Response Status:', adminTransitionRes.statusCode);
        
        // Refresh master and sub orders
        const updatedMaster = await Order.findById(masterOrderData._id);
        const updatedSub = await Order.findById(subOrderToTransition._id);
        console.log('Updated Master Order Status:', updatedMaster.status);
        console.log('Updated Sub-Order Status:', updatedSub.status);
        console.log('Updated Sub-Order Payment Status:', updatedSub.paymentStatus);

        if (updatedMaster.status === 'Verified' && updatedSub.status === 'Verified' && updatedSub.paymentStatus === 'completed') {
            console.log('>> PASS: Admin payment approval successfully propagated Verified status to sub-orders.');
        } else {
            console.log('>> FAIL: Admin payment approval or propagation failed.');
        }

        // Test Case 5.3: Seller now transitions the sub-order to 'Processing'
        console.log('\n* Test 5.3: Seller transitions Verified Sub-Order to "Processing" (Should succeed)');
        transitionReq = {
            params: { id: subOrderToTransition._id },
            body: { status: 'Processing' },
            user: { id: subOrderToTransition.manufacturer.toString(), role: 'manufacturer' }
        };
        transitionRes = makeMockRes();
        await orderController.updateOrderStatus(transitionReq, transitionRes);
        console.log('Response Status:', transitionRes.statusCode);
        
        const finalizedSub = await Order.findById(subOrderToTransition._id);
        console.log('Finalized Sub-Order Status:', finalizedSub.status);
        if (finalizedSub.status === 'Processing') {
            console.log('>> PASS: Seller successfully transitions verified order to "Processing".');
        } else {
            console.log('>> FAIL: Seller transition to "Processing" failed.');
        }

    } else {
        console.log('>> FAIL: Order creation failed! Status:', res.statusCode, 'Data:', res.jsonData);
    }

    console.log('\n=== B2B WHOLESALE UPGRADE VERIFICATION COMPLETE ===');
    await mongoose.disconnect().catch(() => {});
    process.exit(0);
}

testUpgrade().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
