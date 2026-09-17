function asStringArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.map(v => String(v).trim()).filter(Boolean);
}
function asStringMap(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
        if (typeof v === 'string' && v.trim()) {
            out[k] = v.trim();
        }
    }
    return out;
}
function clampInt(value, fallback, min, max) {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, Math.trunc(n)));
}
export function resolveConfig(config) {
    const apiKey = typeof config.apiKey === 'string' ? config.apiKey.trim() : '';
    if (!apiKey) {
        throw new Error('Nimbio platform requires an "apiKey" (create one in the Nimbio portal).');
    }
    const accessoryType = config.accessoryType === 'switch' ? 'switch' : 'garageDoor';
    const latchIdList = asStringArray(config.latchIds);
    return {
        name: typeof config.name === 'string' && config.name.trim() ? config.name.trim() : 'Nimbio',
        apiKey,
        baseUrl: typeof config.baseUrl === 'string' && config.baseUrl.trim() ? config.baseUrl.trim() : undefined,
        latchIds: latchIdList.length ? new Set(latchIdList) : null,
        latchNames: asStringMap(config.latchNames),
        namePrefix: typeof config.namePrefix === 'string' ? config.namePrefix : '',
        autoCloseSeconds: clampInt(config.autoCloseSeconds, 25, 5, 600),
        pollIntervalSeconds: clampInt(config.pollIntervalSeconds, 30, 0, 3600),
        pulseOnClose: Boolean(config.pulseOnClose),
        accessoryType,
        openNote: typeof config.openNote === 'string' && config.openNote.trim() ? config.openNote.trim() : 'HomeKit',
        timeoutSeconds: clampInt(config.timeoutSeconds, 45, 15, 120),
    };
}
//# sourceMappingURL=config.js.map