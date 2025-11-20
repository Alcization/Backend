const nodemailer = require('nodemailer');
const config = require('../config/config');


async function sendMail(to, subject, html) {
const transporter = nodemailer.createTransport({
host: process.env.SMTP_HOST,
port: +process.env.SMTP_PORT || 587,
secure: false,
auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
return transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
}
module.exports = sendMail;