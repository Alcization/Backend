const nodemailer = require('nodemailer');

function toBool(value, defaultValue = false) {
if (value === undefined || value === null || value === '') return defaultValue;
return String(value).toLowerCase() === 'true';
}

function getMailConfig() {
const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
const port = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 587);
const user = process.env.SMTP_USER || process.env.MAIL_USER;
const pass = process.env.SMTP_PASS || process.env.MAIL_PASS;
const from = process.env.SMTP_FROM || process.env.MAIL_FROM || user;
const secure = toBool(process.env.SMTP_SECURE ?? process.env.MAIL_SECURE, port === 465);

if (!host || !user || !pass) {
const err = new Error('Mail service is not configured. Please set SMTP_* or MAIL_* env variables.');
err.status = 500;
throw err;
}

return { host, port, user, pass, from, secure };
}


async function sendMail(to, subject, html) {
const mailConfig = getMailConfig();
const transporter = nodemailer.createTransport({
host: mailConfig.host,
port: mailConfig.port,
secure: mailConfig.secure,
auth: { user: mailConfig.user, pass: mailConfig.pass }
});
return transporter.sendMail({ from: mailConfig.from, to, subject, html });
}
module.exports = sendMail;