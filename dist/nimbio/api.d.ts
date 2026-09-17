import { type AccountKey, type GateStatus, type Me } from '@nimbio/community-api';
import type { DiscoveredLatch, DiscoveryResult } from './types.js';
export interface NimbioApi {
    me(): Promise<Me>;
    listAccountKeys(): Promise<AccountKey[]>;
    accountOpen(keyId: string, latchId: string, note?: string): Promise<unknown>;
    communityGateStatus(): Promise<GateStatus>;
    communityOpen(latchId: string, note?: string): Promise<unknown>;
}
export declare function createNimbioApi(apiKey: string, opts?: {
    baseUrl?: string;
    timeoutSeconds?: number;
}): NimbioApi;
export declare function discoverLatches(api: NimbioApi): Promise<DiscoveryResult>;
export declare function openLatch(api: NimbioApi, latch: Pick<DiscoveredLatch, 'scope' | 'latchId' | 'keyId'>, note: string): Promise<void>;
