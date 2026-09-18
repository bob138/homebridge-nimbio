import type { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';

import type { ResolvedConfig } from '../config.js';
import { openLatch, type NimbioApi } from '../nimbio/api.js';
import type { DiscoveredLatch } from '../nimbio/types.js';
import { MANUFACTURER, MODEL, PLUGIN_VERSION } from '../settings.js';
import type { NimbioPlatform } from '../platform.js';

export interface SwitchAccessoryContext {
  device: DiscoveredLatch;
}

/**
 * Momentary switch: turning On fires a Nimbio open, then returns to Off.
 */
export class SwitchAccessory {
  private readonly service: Service;
  private readonly device: DiscoveredLatch;
  private on = false;
  private busy = false;
  private offTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly platform: NimbioPlatform,
    private readonly accessory: PlatformAccessory<SwitchAccessoryContext>,
    private readonly api: NimbioApi,
    private readonly config: ResolvedConfig,
  ) {
    this.device = accessory.context.device;
    const { Characteristic } = this.platform;

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, MANUFACTURER)
      .setCharacteristic(Characteristic.Model, MODEL)
      .setCharacteristic(Characteristic.SerialNumber, this.device.latchId)
      .setCharacteristic(Characteristic.FirmwareRevision, PLUGIN_VERSION);

    this.service = this.accessory.getService(this.platform.Service.Switch)
      || this.accessory.addService(this.platform.Service.Switch);

    this.service.setCharacteristic(Characteristic.Name, this.accessory.displayName);

    this.service.getCharacteristic(Characteristic.On)
      .onGet(() => this.on)
      .onSet(this.handleSetOn.bind(this));

    this.service.updateCharacteristic(Characteristic.On, false);
  }

  destroy(): void {
    if (this.offTimer) {
      clearTimeout(this.offTimer);
      this.offTimer = null;
    }
  }

  updateFromDiscovery(device: DiscoveredLatch): void {
    this.accessory.context.device = device;
    Object.assign(this.device, device);
  }

  private async handleSetOn(value: CharacteristicValue): Promise<void> {
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
    this.platform.log.info(
      `${this.accessory.displayName}: requesting Nimbio open (${this.device.scope} latch ${this.device.latchId})`,
    );

    try {
      await openLatch(this.api, this.device, this.config.openNote);
      this.platform.log.info(`${this.accessory.displayName}: Nimbio open confirmed`);
    } catch (error) {
      this.platform.log.error(`${this.accessory.displayName}: open failed:`, error);
      this.on = false;
      this.service.updateCharacteristic(this.platform.Characteristic.On, false);
      throw new hbApi.hap.HapStatusError(hbApi.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    } finally {
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
