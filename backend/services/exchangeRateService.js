const https = require('https');

/**
 * Fetch text/JSON content from a URL via HTTPS
 */
function fetchJson(url, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
            }
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve(parsed);
                } catch (e) {
                    reject(new Error(`Invalid JSON from ${url}: ${e.message}`));
                }
            });
        });
        req.on('error', err => reject(err));
        req.setTimeout(timeoutMs, () => {
            req.destroy();
            reject(new Error(`Timeout fetching ${url}`));
        });
    });
}

/**
 * Retrieve current EUR/PKR exchange rate (How many PKR equal 1 EUR).
 * Returns rate as Number (e.g. 302.50).
 */
async function getEurToPkrRate() {
    const endpoints = [
        async () => {
            const data = await fetchJson('https://open.er-api.com/v6/latest/EUR');
            if (data && data.result === 'success' && data.rates && data.rates.PKR) {
                return Number(data.rates.PKR);
            }
            throw new Error('Malformed response from open.er-api.com');
        },
        async () => {
            const data = await fetchJson('https://api.exchangerate-api.com/v4/latest/EUR');
            if (data && data.rates && data.rates.PKR) {
                return Number(data.rates.PKR);
            }
            throw new Error('Malformed response from exchangerate-api.com');
        },
        async () => {
            const data = await fetchJson('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json');
            if (data && data.eur && data.eur.pkr) {
                return Number(data.eur.pkr);
            }
            throw new Error('Malformed response from Fawaz Ahmed Currency API');
        }
    ];

    for (const fetchFn of endpoints) {
        try {
            const rate = await fetchFn();
            if (Number.isFinite(rate) && rate > 0) {
                return rate;
            }
        } catch (err) {
            console.warn('[exchange-rate-service] Endpoint warning:', err.message);
        }
    }

    throw new Error('Failed to retrieve live EUR/PKR exchange rate from exchange rate providers');
}

/**
 * Convert PKR net payout amount to EUR and Stripe smallest currency unit (cents)
 */
async function convertPkrToEur(netAmountPkr) {
    if (!Number.isFinite(netAmountPkr) || netAmountPkr <= 0) {
        throw new Error('Invalid PKR payout amount for currency conversion');
    }

    const pkrPerEur = await getEurToPkrRate();
    if (!pkrPerEur || pkrPerEur <= 0) {
        throw new Error('Retrieved EUR/PKR exchange rate is invalid');
    }

    const amountEur = netAmountPkr / pkrPerEur;
    const amountEurFormatted = Math.round(amountEur * 100) / 100;
    const amountEurCents = Math.round(amountEur * 100);

    if (amountEurCents <= 0) {
        throw new Error('Converted EUR payout amount is less than 0.01 EUR minimum threshold');
    }

    return {
        netAmountPkr,
        pkrPerEur,
        amountEur: amountEurFormatted,
        amountEurCents
    };
}

module.exports = {
    getEurToPkrRate,
    convertPkrToEur
};
