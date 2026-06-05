const alertEvaluator = require('../services/alertEvaluator.service');

const DEFAULT_INTERVAL_MINUTES = Number(process.env.ALERT_EVAL_INTERVAL_MINUTES) || 15;

let cronTask = null;
let timerHandle = null;

const runOnce = async () => {
    try {
        const start = Date.now();
        const result = await alertEvaluator.evaluateAll({ logger: console });
        console.log(`[alert-worker] evaluated=${result.evaluated} fired=${result.fired} in ${Date.now() - start}ms`);
    } catch (err) {
        console.error('[alert-worker] tick failed', err?.message || err);
    }
};

const start = ({ intervalMinutes = DEFAULT_INTERVAL_MINUTES, runImmediately = true } = {}) => {
    if (cronTask || timerHandle) return;

    // Prefer node-cron if installed; otherwise fall back to setInterval.
    try {
        const cron = require('node-cron');
        const expression = `*/${intervalMinutes} * * * *`;
        cronTask = cron.schedule(expression, runOnce, { scheduled: true });
        console.log(`[alert-worker] node-cron scheduled "${expression}"`);
    } catch (_err) {
        const ms = intervalMinutes * 60_000;
        timerHandle = setInterval(runOnce, ms);
        console.log(`[alert-worker] setInterval scheduled every ${intervalMinutes}m (node-cron not installed)`);
    }

    if (runImmediately) {
        // Fire a first tick shortly after boot so users don't have to wait a full window.
        setTimeout(runOnce, 5000);
    }
};

const stop = () => {
    if (cronTask) { cronTask.stop(); cronTask = null; }
    if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
};

module.exports = { start, stop, runOnce };
