import { openLatch } from '../nimbio/api.js';
import { classifyGateStatus } from '../nimbio/types.js';
import { MANUFACTURER, MODEL } from '../settings.js';
/**
 * HomeKit GarageDoorOpener for a Nimbio latch.
 *
 * Typical homeowner (account) keys cannot read physical open/closed state from
 * Nimbio. After a successful open, HomeKit shows Open, then a timer matching
 * the gate opener's hardware auto-close marks it Closed again.
 *
 * Community keys with sense lines can poll real gate-status instead of the timer.
 */
export class GateAccessory {
    platform;
    accessory;
    api;
    config;
    service;
    device;
    targetState;
    currentState;
    obstruction = false;
    busy = false;
    autoCloseTimer = null;
    closingLeadTimer = null;
    pollTimer = null;
    constructor(platform, accessory, api, config) {
        this.platform = platform;
        this.accessory = accessory;
        this.api = api;
        this.config = config;
        this.device = accessory.context.device;
        const { Characteristic } = this.platform;
        this.currentState = Characteristic.CurrentDoorState.CLOSED;
        this.targetState = Characteristic.TargetDoorState.CLOSED;
        if (this.device.heldOpen || classifyGateStatus(this.device.status) === 'open') {
            this.currentState = Characteristic.CurrentDoorState.OPEN;
            this.targetState = Characteristic.TargetDoorState.OPEN;
        }
        this.obstruction = Boolean(this.device.offline);
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(Characteristic.Manufacturer, MANUFACTURER)
            .setCharacteristic(Characteristic.Model, MODEL)
            .setCharacteristic(Characteristic.SerialNumber, this.device.latchId)
            .setCharacteristic(Characteristic.FirmwareRevision, '1.0.0');
        this.service = this.accessory.getService(this.platform.Service.GarageDoorOpener)
            || this.accessory.addService(this.platform.Service.GarageDoorOpener);
        this.service.setCharacteristic(Characteristic.Name, this.accessory.displayName);
        this.service.getCharacteristic(Characteristic.CurrentDoorState)
            .onGet(() => this.currentState);
        this.service.getCharacteristic(Characteristic.TargetDoorState)
            .onGet(() => this.targetState)
            .onSet(this.handleSetTarget.bind(this));
        this.service.getCharacteristic(Characteristic.ObstructionDetected)
            .onGet(() => this.obstruction);
        this.service.updateCharacteristic(Characteristic.CurrentDoorState, this.currentState);
        this.service.updateCharacteristic(Characteristic.TargetDoorState, this.targetState);
        this.service.updateCharacteristic(Characteristic.ObstructionDetected, this.obstruction);
        if (this.usesSensedStatus() && this.config.pollIntervalSeconds > 0) {
            this.pollTimer = setInterval(() => {
                void this.refreshStatus();
            }, this.config.pollIntervalSeconds * 1000);
            this.pollTimer.unref?.();
        }
    }
    destroy() {
        this.clearAutoClose();
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }
    updateFromDiscovery(device) {
        this.accessory.context.device = device;
        Object.assign(this.device, device);
        this.obstruction = Boolean(device.offline);
        this.service.updateCharacteristic(this.platform.Characteristic.ObstructionDetected, this.obstruction);
        if (this.usesSensedStatus()) {
            this.applySensedStatus(device.status, device.heldOpen);
        }
    }
    /** True when Nimbio can report physical open/closed for this latch. */
    usesSensedStatus() {
        return this.device.hasStatus && this.device.scope === 'community';
    }
    async refreshStatus() {
        try {
            const status = await this.api.communityGateStatus();
            const latch = status.latches.find(l => l.latchId === this.device.latchId);
            if (!latch) {
                return;
            }
            this.obstruction = Boolean(latch.offline);
            this.service.updateCharacteristic(this.platform.Characteristic.ObstructionDetected, this.obstruction);
            this.applySensedStatus(latch.status, false);
        }
        catch (error) {
            this.platform.log.debug(`Failed to poll gate status for ${this.device.latchId}:`, error);
        }
    }
    applySensedStatus(status, heldOpen) {
        if (this.busy) {
            return;
        }
        const { Characteristic } = this.platform;
        const bucket = heldOpen ? 'open' : classifyGateStatus(status);
        switch (bucket) {
            case 'open':
                this.currentState = Characteristic.CurrentDoorState.OPEN;
                this.targetState = Characteristic.TargetDoorState.OPEN;
                break;
            case 'closed':
                this.currentState = Characteristic.CurrentDoorState.CLOSED;
                this.targetState = Characteristic.TargetDoorState.CLOSED;
                break;
            case 'opening':
                this.currentState = Characteristic.CurrentDoorState.OPENING;
                this.targetState = Characteristic.TargetDoorState.OPEN;
                break;
            case 'closing':
                this.currentState = Characteristic.CurrentDoorState.CLOSING;
                this.targetState = Characteristic.TargetDoorState.CLOSED;
                break;
            case 'stopped':
                this.currentState = Characteristic.CurrentDoorState.STOPPED;
                break;
            default:
                return;
        }
        this.service.updateCharacteristic(Characteristic.CurrentDoorState, this.currentState);
        this.service.updateCharacteristic(Characteristic.TargetDoorState, this.targetState);
    }
    clearAutoClose() {
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }
        if (this.closingLeadTimer) {
            clearTimeout(this.closingLeadTimer);
            this.closingLeadTimer = null;
        }
    }
    /**
     * Mirror the gate opener's hardware auto-close in HomeKit when Nimbio cannot
     * sense physical closed state.
     */
    scheduleAutoClose() {
        this.clearAutoClose();
        if (this.usesSensedStatus()) {
            return;
        }
        const totalMs = this.config.autoCloseSeconds * 1000;
        // Show Closing for the last few seconds so HomeKit looks natural.
        const closingLeadMs = Math.min(3_000, Math.max(0, totalMs - 2_000));
        this.platform.log.info(`${this.accessory.displayName}: HomeKit will show Closed in ${this.config.autoCloseSeconds}s (matches typical hardware auto-close; Nimbio has no closed sensor for this key)`);
        if (closingLeadMs > 0) {
            this.closingLeadTimer = setTimeout(() => {
                const { Characteristic } = this.platform;
                this.currentState = Characteristic.CurrentDoorState.CLOSING;
                this.targetState = Characteristic.TargetDoorState.CLOSED;
                this.service.updateCharacteristic(Characteristic.CurrentDoorState, this.currentState);
                this.service.updateCharacteristic(Characteristic.TargetDoorState, this.targetState);
            }, totalMs - closingLeadMs);
            this.closingLeadTimer.unref?.();
        }
        this.autoCloseTimer = setTimeout(() => {
            const { Characteristic } = this.platform;
            this.currentState = Characteristic.CurrentDoorState.CLOSED;
            this.targetState = Characteristic.TargetDoorState.CLOSED;
            this.service.updateCharacteristic(Characteristic.CurrentDoorState, this.currentState);
            this.service.updateCharacteristic(Characteristic.TargetDoorState, this.targetState);
            this.platform.log.info(`${this.accessory.displayName}: HomeKit marked Closed after auto-close timer`);
        }, totalMs);
        this.autoCloseTimer.unref?.();
    }
    async handleSetTarget(value) {
        const { Characteristic, api: hbApi } = this.platform;
        const target = value;
        if (target === Characteristic.TargetDoorState.CLOSED) {
            this.clearAutoClose();
            this.targetState = Characteristic.TargetDoorState.CLOSED;
            if (this.config.pulseOnClose) {
                await this.pulse('close');
                return;
            }
            // Local state only — the physical gate already auto-closes on its own.
            this.currentState = Characteristic.CurrentDoorState.CLOSED;
            this.service.updateCharacteristic(Characteristic.CurrentDoorState, this.currentState);
            this.platform.log.info(`${this.accessory.displayName}: HomeKit closed (local state; gate auto-closes in hardware)`);
            return;
        }
        if (target !== Characteristic.TargetDoorState.OPEN) {
            return;
        }
        this.targetState = Characteristic.TargetDoorState.OPEN;
        try {
            await this.pulse('open');
        }
        catch (error) {
            this.clearAutoClose();
            this.targetState = Characteristic.TargetDoorState.CLOSED;
            this.currentState = Characteristic.CurrentDoorState.CLOSED;
            this.service.updateCharacteristic(Characteristic.TargetDoorState, this.targetState);
            this.service.updateCharacteristic(Characteristic.CurrentDoorState, this.currentState);
            this.platform.log.error(`${this.accessory.displayName}: open failed:`, error);
            throw new hbApi.hap.HapStatusError(-70402 /* hbApi.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    async pulse(reason) {
        if (this.busy) {
            this.platform.log.warn(`${this.accessory.displayName}: ignoring ${reason}; open already in progress`);
            return;
        }
        const { Characteristic } = this.platform;
        this.busy = true;
        this.clearAutoClose();
        this.currentState = reason === 'open'
            ? Characteristic.CurrentDoorState.OPENING
            : Characteristic.CurrentDoorState.CLOSING;
        this.service.updateCharacteristic(Characteristic.CurrentDoorState, this.currentState);
        this.platform.log.info(`${this.accessory.displayName}: requesting Nimbio ${reason} (${this.device.scope} latch ${this.device.latchId})`);
        try {
            await openLatch(this.api, this.device, this.config.openNote);
            this.currentState = reason === 'open'
                ? Characteristic.CurrentDoorState.OPEN
                : Characteristic.CurrentDoorState.CLOSED;
            this.targetState = reason === 'open'
                ? Characteristic.TargetDoorState.OPEN
                : Characteristic.TargetDoorState.CLOSED;
            this.service.updateCharacteristic(Characteristic.CurrentDoorState, this.currentState);
            this.service.updateCharacteristic(Characteristic.TargetDoorState, this.targetState);
            this.platform.log.info(`${this.accessory.displayName}: Nimbio ${reason} confirmed`);
            if (reason === 'open') {
                this.scheduleAutoClose();
            }
        }
        finally {
            this.busy = false;
        }
    }
}
//# sourceMappingURL=gateAccessory.js.map