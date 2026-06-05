const { PushSubscription } = require('../models/locationAlert.model');
const notificationSocket = require('../sockets/notification.socket');

let webpush = null;
let vapidConfigured = false;

const initWebPush = () => {
    if (webpush || vapidConfigured) return webpush;
    try {
        webpush = require('web-push');
    } catch (_err) {
        // web-push not installed yet — skip silently. The server still works,
        // browser push just won't fire until you `npm i web-push`.
        return null;
    }
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const contact = process.env.VAPID_CONTACT_EMAIL || 'mailto:admin@example.com';
    if (!publicKey || !privateKey) {
        console.warn('[push] VAPID keys missing — web push delivery disabled.');
        return webpush;
    }
    webpush.setVapidDetails(contact, publicKey, privateKey);
    vapidConfigured = true;
    return webpush;
};

const sendWebPush = async (userId, payload) => {
    const wp = initWebPush();
    if (!wp || !vapidConfigured) return { sent: 0, removed: 0 };

    const subs = await PushSubscription.findAll({ where: { user_id: userId } });
    const message = JSON.stringify(payload);
    let sent = 0;
    let removed = 0;

    await Promise.all(subs.map(async (sub) => {
        const subscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
        };
        try {
            await wp.sendNotification(subscription, message);
            sent += 1;
        } catch (err) {
            if (err && (err.statusCode === 404 || err.statusCode === 410)) {
                // subscription is gone — clean it up
                await sub.destroy();
                removed += 1;
            } else {
                console.error('[push] send failed', err?.statusCode, err?.body || err?.message);
            }
        }
    }));

    return { sent, removed };
};

const deliver = async (userId, payload) => {
    const wsCount = notificationSocket.broadcastToUser(userId, {
        type: 'alert',
        ...payload
    });
    const push = await sendWebPush(userId, payload);
    return { wsCount, push };
};

module.exports = { deliver, sendWebPush, initWebPush };
