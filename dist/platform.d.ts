import type { API, Characteristic, DynamicPlatformPlugin, Logging, PlatformAccessory, Service } from 'homebridge';
/**
 * Dynamic platform: discovers Nimbio latches from the configured API key and
 * exposes each one as a HomeKit Garage Door Opener (or Switch).
 */
export declare class NimbioPlatform implements DynamicPlatformPlugin {
    readonly log: Logging;
    readonly config: Record<string, unknown>;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    readonly accessories: Map<string, PlatformAccessory<import("homebridge").UnknownContext>>;
    private readonly handlers;
    private readonly discoveredCacheUUIDs;
    private resolved;
    private nimbio;
    constructor(log: Logging, config: Record<string, unknown>, api: API);
    configureAccessory(accessory: PlatformAccessory): void;
    private discoverDevices;
    private attachHandler;
}
