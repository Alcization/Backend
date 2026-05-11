const https = require('https');
const querystring = require('querystring');

/**
 * Gửi email qua Mailgun REST API
 * @param {string} to - Email người nhận
 * @param {string} subject - Tiêu đề email
 * @param {string} html - Nội dung HTML
 */
async function sendMailMailgun(to, subject, html) {
    const mailgunApiKey = process.env.MAILGUN_API_KEY;
    const mailgunDomain = process.env.MAILGUN_DOMAIN;
    const mailgunFrom = process.env.MAILGUN_FROM || `noreply@${mailgunDomain}`;

    if (!mailgunApiKey || !mailgunDomain) {
        const err = new Error('Mailgun service is not configured. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN env variables.');
        err.status = 500;
        throw err;
    }

    const auth = Buffer.from(`api:${mailgunApiKey}`).toString('base64');
    
    const postData = querystring.stringify({
        from: mailgunFrom,
        to: to,
        subject: subject,
        html: html
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.mailgun.net',
            path: `/v3/${mailgunDomain}/messages`,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                } else {
                    try {
                        const error = new Error(JSON.parse(data).message || `HTTP ${res.statusCode}`);
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

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

module.exports = sendMailMailgun;
