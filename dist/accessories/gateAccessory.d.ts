import type { PlatformAccessory } from 'homebridge';
import type { ResolvedConfig } from '../config.js';
import { type NimbioApi } from '../nimbio/api.js';
import { type DiscoveredLatch } from '../nimbio/types.js';
import type { NimbioPlatform } from '../platform.js';
export interface GateAccessoryContext {
    device: DiscoveredLatch;
}
/**
 * HomeKit GarageDoorOpener for a Nimbio latch.
 *
 * Account keys usually have no sense line, so HomeKit state is momentary:
 * Open → API pulse → show Open briefly → auto-close to Closed.
 * Community keys with gate-status can optionally poll real open/closed state.
 */
export declare class GateAccessory {
    private readonly platform;
    private readonly accessory;
    private readonly api;
    private readonly config;
    private readonly service;
    private readonly device;
    private targetState;
    private currentState;
    private obstruction;
    private busy;
    private autoCloseTimer;
    private pollTimer;
    constructor(platform: NimbioPlatform, accessory: PlatformAccessory<GateAccessoryContext>, api: NimbioApi, config: ResolvedConfig);
    destroy(): void;
    updateFromDiscovery(device: DiscoveredLatch): void;
    private refreshStatus;
    private applySensedStatus;
    private clearAutoClose;
    private scheduleAutoClose;
    private handleSetTarget;
    private pulse;
}
