export type NimbioKeyScope = 'account' | 'community';
export interface DiscoveredLatch {
    /** Stable unique ID used for Homebridge UUID generation. */
    uniqueId: string;
    latchId: string;
    /** Present for account-scoped opens. */
    keyId?: string;
    name: string;
    location?: string;
    offline: boolean;
    heldOpen: boolean;
    /** Latest sensed status when available (community sense lines). */
    status?: string | null;
    scope: NimbioKeyScope;
    hasStatus: boolean;
}
export interface DiscoveryResult {
    scope: NimbioKeyScope;
    mode: string | null;
    accountId: string | null;
    latches: DiscoveredLatch[];
}
export declare function displayNameForLatch(latch: Pick<DiscoveredLatch, 'latchId' | 'name'>, opts: {
    namePrefix?: string;
    latchNames?: Record<string, string>;
}): string;
export declare function filterLatches(latches: DiscoveredLatch[], latchIds: Set<string> | null): DiscoveredLatch[];
/**
 * Map a Nimbio gate-status string to a coarse open/closed/moving bucket.
 * Community sense lines use free-form vocabularies; we classify conservatively.
 */
export type DoorBucket = 'open' | 'closed' | 'opening' | 'closing' | 'stopped' | 'unknown';
export declare function classifyGateStatus(status: string | null | undefined): DoorBucket;
