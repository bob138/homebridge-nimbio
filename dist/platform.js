import { GateAccessory } from './accessories/gateAccessory.js';
import { SwitchAccessory } from './accessories/switchAccessory.js';
import { resolveConfig } from './config.js';
import { createNimbioApi, discoverLatches } from './nimbio/api.js';
import { displayNameForLatch, filterLatches } from './nimbio/types.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
/**
 * Dynamic platform: discovers Nimbio latches from the configured API key and
 * exposes each one as a HomeKit Garage Door Opener (or Switch).
 */
export class NimbioPlatform {
    log;
    config;
    api;
    Service;
    Characteristic;
    accessories = new Map();
    handlers = new Map();
    discoveredCacheUUIDs = [];
    resolved;
    nimbio;
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = api.hap.Service;
        this.Characteristic = api.hap.Characteristic;
        try {
            this.resolved = resolveConfig(config);
            this.nimbio = createNimbioApi(this.resolved.apiKey, {
                baseUrl: this.resolved.baseUrl,
                timeoutSeconds: this.resolved.timeoutSeconds,
            });
        }
        catch (error) {
            this.log.error(String(error));
            return;
        }
        this.log.debug('Finished initializing platform:', this.resolved.name);
        this.api.on('didFinishLaunching', () => {
            this.log.debug('Executed didFinishLaunching callback');
            void this.discoverDevices();
        });
        this.api.on('shutdown', () => {
            for (const handler of this.handlers.values()) {
                handler.destroy();
            }
            this.handlers.clear();
        });
    }
    configureAccessory(accessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        this.accessories.set(accessory.UUID, accessory);
    }
    async discoverDevices() {
        if (!this.resolved || !this.nimbio) {
            return;
        }
        let discovered;
        try {
            const result = await discoverLatches(this.nimbio);
            discovered = filterLatches(result.latches, this.resolved.latchIds);
            this.log.info(`Connected to Nimbio (${result.scope}); found ${result.latches.length} gate(s), exposing ${discovered.length}`);
            if (result.mode === 'test') {
                this.log.error('This API key is a test key (nimbio_test_…). It will not open your gate. Create a live key (nimbio_live_…) in the Nimbio portal and update the plugin settings.');
            }
        }
        catch (error) {
            this.log.error('Failed to discover Nimbio latches:', error);
            return;
        }
        this.discoveredCacheUUIDs.length = 0;
        for (const device of discovered) {
            const uuid = this.api.hap.uuid.generate(device.uniqueId);
            this.discoveredCacheUUIDs.push(uuid);
            const name = displayNameForLatch(device, {
                namePrefix: this.resolved.namePrefix,
                latchNames: this.resolved.latchNames,
            });
            const existing = this.accessories.get(uuid);
            if (existing) {
                this.log.info('Restoring existing accessory from cache:', existing.displayName);
                existing.context.device = device;
                existing.displayName = name;
                this.api.updatePlatformAccessories([existing]);
                this.attachHandler(existing, device);
            }
            else {
                this.log.info('Adding new accessory:', name);
                const accessory = new this.api.platformAccessory(name, uuid);
                accessory.context.device = device;
                this.attachHandler(accessory, device);
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                this.accessories.set(uuid, accessory);
            }
        }
        for (const [uuid, accessory] of this.accessories) {
            if (!this.discoveredCacheUUIDs.includes(uuid)) {
                this.log.info('Removing existing accessory from cache:', accessory.displayName);
                this.handlers.get(uuid)?.destroy();
                this.handlers.delete(uuid);
                this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                this.accessories.delete(uuid);
            }
        }
    }
    attachHandler(accessory, device) {
        const existing = this.handlers.get(accessory.UUID);
        if (existing) {
            existing.updateFromDiscovery(device);
            return;
        }
        const handler = this.resolved.accessoryType === 'switch'
            ? new SwitchAccessory(this, accessory, this.nimbio, this.resolved)
            : new GateAccessory(this, accessory, this.nimbio, this.resolved);
        this.handlers.set(accessory.UUID, handler);
    }
}
//# sourceMappingURL=platform.js.map