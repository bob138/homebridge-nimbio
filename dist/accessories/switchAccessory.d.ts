import type { PlatformAccessory } from 'homebridge';
import type { ResolvedConfig } from '../config.js';
import { type NimbioApi } from '../nimbio/api.js';
import type { DiscoveredLatch } from '../nimbio/types.js';
import type { NimbioPlatform } from '../platform.js';
export interface SwitchAccessoryContext {
    device: DiscoveredLatch;
}
/**
 * Momentary switch: turning On fires a Nimbio open, then returns to Off.
 */
export declare class SwitchAccessory {
    private readonly platform;
    private readonly accessory;
    private readonly api;
    private readonly config;
    private readonly service;
    private readonly device;
    private on;
    private busy;
    private offTimer;
    constructor(platform: NimbioPlatform, accessory: PlatformAccessory<SwitchAccessoryContext>, api: NimbioApi, config: ResolvedConfig);
    destroy(): void;
    updateFromDiscovery(device: DiscoveredLatch): void;
    private handleSetOn;
}
