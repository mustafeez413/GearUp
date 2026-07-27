const stripe = require('./stripeService');
const User = require('../models/User');

/**
 * Service handling Stripe Connect Express operations
 */

/**
 * Create a Stripe Express connected account for a seller
 */
async function createExpressAccount(user) {
    if (!stripe) {
        throw new Error('Stripe API key is not configured.');
    }

    if (user.stripeAccountId) {
        return user.stripeAccountId;
    }

    const account = await stripe.accounts.create({
        type: 'express',
        country: 'US', // Default Express country for platform testing / transfers
        email: user.email,
        capabilities: {
            transfers: { requested: true },
            card_payments: { requested: true }
        },
        business_type: 'individual',
        metadata: {
            userId: user._id.toString(),
            userRole: user.role || 'seller'
        }
    });

    user.stripeAccountId = account.id;
    user.stripeAccountStatus = 'Pending';
    user.stripeAccountCreatedAt = new Date();
    user.lastStripeSync = new Date();
    await user.save();

    return account.id;
}

/**
 * Generate onboarding account link for Stripe Express
 */
async function createAccountOnboardingLink(stripeAccountId, returnUrl, refreshUrl) {
    if (!stripe) {
        throw new Error('Stripe API key is not configured.');
    }

    const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding'
    });

    return accountLink.url;
}

/**
 * Generate login link for connected seller to access Stripe Express dashboard
 */
async function createLoginLink(stripeAccountId) {
    if (!stripe) {
        throw new Error('Stripe API key is not configured.');
    }

    const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
    return loginLink.url;
}

/**
 * Sync seller's Stripe account status from Stripe API
 */
async function syncAccountStatus(userId) {
    const user = await User.findById(userId);
    if (!user || !user.stripeAccountId) {
        return user;
    }

    try {
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        
        const chargesEnabled = Boolean(account.charges_enabled);
        const payoutsEnabled = Boolean(account.payouts_enabled);
        const detailsSubmitted = Boolean(account.details_submitted);
        const hasDisabledReason = Boolean(account.requirements?.disabled_reason);

        let status = 'Pending';
        if (!detailsSubmitted) {
            status = 'Pending';
        } else if (hasDisabledReason) {
            status = 'Disabled';
        } else if (chargesEnabled && payoutsEnabled) {
            status = 'Verified';
        } else if (!chargesEnabled || !payoutsEnabled) {
            status = 'Restricted';
        }

        user.stripeChargesEnabled = chargesEnabled;
        user.stripePayoutsEnabled = payoutsEnabled;
        user.stripeOnboardingCompleted = detailsSubmitted;
        user.stripeAccountStatus = status;
        user.lastStripeSync = new Date();

        await user.save();
        return user;
    } catch (err) {
        console.error(`[stripe-connect-sync] Failed to sync account ${user.stripeAccountId}:`, err.message);
        return user;
    }
}

/**
 * Create Stripe Transfer to Connected Seller Account
 */
async function createTransferToConnectedAccount(stripeAccountId, amountInCurrency, currency = 'eur', orderId = '') {
    if (!stripe) {
        throw new Error('Stripe API key is not configured.');
    }

    if (!stripeAccountId) {
        throw new Error('Seller has no connected Stripe account.');
    }

    // Amount in minor currency units (cents for EUR)
    const amountInMinorUnits = Math.round(Number(amountInCurrency) * 100);

    const transferParams = {
        amount: amountInMinorUnits,
        currency: (currency || 'eur').toLowerCase(),
        destination: stripeAccountId,
        description: `GearUp Payout for Order ${orderId}`
    };

    if (orderId) {
        transferParams.transfer_group = orderId.toString();
    }

    const transfer = await stripe.transfers.create(transferParams);
    return transfer;
}

/**
 * Get balance for a connected seller account
 */
async function getConnectedAccountBalance(stripeAccountId) {
    if (!stripe || !stripeAccountId) {
        return { available: 0, pending: 0 };
    }

    try {
        const balance = await stripe.balance.retrieve({
            stripeAccount: stripeAccountId
        });

        const available = (balance.available || []).reduce((sum, b) => sum + (b.amount / 100), 0);
        const pending = (balance.pending || []).reduce((sum, b) => sum + (b.amount / 100), 0);

        return { available, pending };
    } catch (err) {
        console.warn(`[stripe-connect-balance] Could not fetch balance for ${stripeAccountId}:`, err.message);
        return { available: 0, pending: 0 };
    }
}

module.exports = {
    createExpressAccount,
    createAccountOnboardingLink,
    createLoginLink,
    syncAccountStatus,
    createTransferToConnectedAccount,
    getConnectedAccountBalance
};
