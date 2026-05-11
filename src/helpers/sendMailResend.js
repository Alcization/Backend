const https = require('https');

/**
 * Gửi email qua Resend API
 * @param {string} to - Email người nhận
 * @param {string} subject - Tiêu đề email
 * @param {string} html - Nội dung HTML
 */
async function sendMailResend(to, subject, html) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || `noreply@${(process.env.RESEND_DOMAIN || 'example.com')}`;

    if (!apiKey) {
        const err = new Error('Resend service is not configured. Please set RESEND_API_KEY env variable.');
        err.status = 500;
        throw err;
    }

    const payload = JSON.stringify({
        from,
        to,
        subject,
        html
    });

    const options = {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'Authorization': `Bearer ${apiKey}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
                } else {
                    try {
                        const parsed = JSON.parse(data);
                        const error = new Error(parsed.error || `HTTP ${res.statusCode}`);
                        error.status = res.statusCode;
                        reject(error);
                    } catch (e) {
                        const error = new Error(`HTTP ${res.statusCode}: ${data}`);
                        error.status = res.statusCode;
                        reject(error);
                    }
                }
            });
        });

        req.on('error', (e) => { reject(e); });
        req.write(payload);
        req.end();
    });
}

module.exports = sendMailResend;
