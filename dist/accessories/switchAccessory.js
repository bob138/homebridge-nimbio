import { openLatch } from '../nimbio/api.js';
import { MANUFACTURER, MODEL } from '../settings.js';
/**
 * Momentary switch: turning On fires a Nimbio open, then returns to Off.
 */
export class SwitchAccessory {
    platform;
    accessory;
    api;
    config;
    service;
    device;
    on = false;
    busy = false;
    offTimer = null;
    constructor(platform, accessory, api, config) {
        this.platform = platform;
        this.accessory = accessory;
        this.api = api;
        this.config = config;
        this.device = accessory.context.device;
        const { Characteristic } = this.platform;
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(Characteristic.Manufacturer, MANUFACTURER)
            .setCharacteristic(Characteristic.Model, MODEL)
            .setCharacteristic(Characteristic.SerialNumber, this.device.latchId)
            .setCharacteristic(Characteristic.FirmwareRevision, '1.0.0');
        this.service = this.accessory.getService(this.platform.Service.Switch)
            || this.accessory.addService(this.platform.Service.Switch);
        this.service.setCharacteristic(Characteristic.Name, this.accessory.displayName);
        this.service.getCharacteristic(Characteristic.On)
            .onGet(() => this.on)
            .onSet(this.handleSetOn.bind(this));
        this.service.updateCharacteristic(Characteristic.On, false);
    }
    destroy() {
        if (this.offTimer) {
            clearTimeout(this.offTimer);
            this.offTimer = null;
        }
    }
    updateFromDiscovery(device) {
        this.accessory.context.device = device;
        Object.assign(this.device, device);
    }
    async handleSetOn(value) {
        const { api: hbApi } = this.platform;
        const desired = Boolean(value);
        if (!desired) {
            this.on = false;
            return;
        }
        if (this.busy) {
            this.platform.log.warn(`${this.accessory.displayName}: open already in progress`);
            this.service.updateCharacteristic(this.platform.Characteristic.On, false);
            this.on = false;
            return;
        }
        this.busy = true;
        this.on = true;
        this.platform.log.info(`${this.accessory.displayName}: requesting Nimbio open (${this.device.scope} latch ${this.device.latchId})`);
        try {
            await openLatch(this.api, this.device, this.config.openNote);
            this.platform.log.info(`${this.accessory.displayName}: Nimbio open confirmed`);
        }
        catch (error) {
            this.platform.log.error(`${this.accessory.displayName}: open failed:`, error);
            this.on = false;
            this.service.updateCharacteristic(this.platform.Characteristic.On, false);
            throw new hbApi.hap.HapStatusError(-70402 /* hbApi.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE */);
        }
        finally {
            this.busy = false;
            // Momentary: flip back Off shortly so the switch can be tapped again.
            this.offTimer = setTimeout(() => {
                this.on = false;
                this.service.updateCharacteristic(this.platform.Characteristic.On, false);
            }, 750);
            this.offTimer.unref?.();
        }
    }
}
//# sourceMappingURL=switchAccessory.js.map