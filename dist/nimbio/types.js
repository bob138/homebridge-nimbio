export function displayNameForLatch(latch, opts) {
    const override = opts.latchNames?.[latch.latchId];
    const base = (override || latch.name || `Latch ${latch.latchId}`).trim();
    const prefix = opts.namePrefix ?? '';
    return prefix ? `${prefix}${base}` : base;
}
export function filterLatches(latches, latchIds) {
    if (!latchIds) {
        return latches;
    }
    return latches.filter(l => latchIds.has(l.latchId));
}
export function classifyGateStatus(status) {
    if (!status) {
        return 'unknown';
    }
    const s = status.trim().toLowerCase();
    if (!s) {
        return 'unknown';
    }
    if (/(opening|opening…|opening\.\.\.)/.test(s)) {
        return 'opening';
    }
    if (/(closing|closing…|closing\.\.\.)/.test(s)) {
        return 'closing';
    }
    if (/(^|\b)(open|opened|unlocked|held[\s_-]?open)(\b|$)/.test(s)) {
        return 'open';
    }
    if (/(^|\b)(closed|close|locked|secure)(\b|$)/.test(s)) {
        return 'closed';
    }
    if (/(stopped|obstruct|fault|error|jam)/.test(s)) {
        return 'stopped';
    }
    return 'unknown';
}
//# sourceMappingURL=types.js.map