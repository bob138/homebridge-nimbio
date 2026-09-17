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
 * Typical homeowner (account) keys cannot read physical open/closed state from
 * Nimbio. After a successful open, HomeKit shows Open, then a timer matching
 * the gate opener's hardware auto-close marks it Closed again.
 *
 * Community keys with sense lines can poll real gate-status instead of the timer.
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
    private closingLeadTimer;
    private pollTimer;
    constructor(platform: NimbioPlatform, accessory: PlatformAccessory<GateAccessoryContext>, api: NimbioApi, config: ResolvedConfig);
    destroy(): void;
    updateFromDiscovery(device: DiscoveredLatch): void;
    /** True when Nimbio can report physical open/closed for this latch. */
    private usesSensedStatus;
    private refreshStatus;
    private applySensedStatus;
    private clearAutoClose;
    /**
     * Mirror the gate opener's hardware auto-close in HomeKit when Nimbio cannot
     * sense physical closed state.
     */
    private scheduleAutoClose;
    private handleSetTarget;
    private pulse;
}
