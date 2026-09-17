import { NimbioClient, type AccountKey, type GateStatus, type Me } from '@nimbio/community-api';

import type { DiscoveredLatch, DiscoveryResult, NimbioKeyScope } from './types.js';

export interface NimbioApi {
  me(): Promise<Me>;
  listAccountKeys(): Promise<AccountKey[]>;
  accountOpen(keyId: string, latchId: string, note?: string): Promise<unknown>;
  communityGateStatus(): Promise<GateStatus>;
  communityOpen(latchId: string, note?: string): Promise<unknown>;
}

export function createNimbioApi(apiKey: string, opts: { baseUrl?: string; timeoutSeconds?: number } = {}): NimbioApi {
  const client = new NimbioClient(apiKey, {
    baseUrl: opts.baseUrl,
    timeout: opts.timeoutSeconds ?? 45,
    maxRetries: 2,
  });

  return {
    me: () => client.me(),
    listAccountKeys: () => client.account.keys({ includeHidden: false }),
    accountOpen: (keyId, latchId, note) => client.account.open(keyId, latchId, { note }),
    communityGateStatus: () => client.community.gateStatus(),
    communityOpen: (latchId, note) => client.community.open(latchId, { note }),
  };
}

function latchesFromAccountKeys(keys: AccountKey[]): DiscoveredLatch[] {
  const out: DiscoveredLatch[] = [];
  for (const key of keys) {
    if (key.disabled || key.pending || !key.id) {
      continue;
    }
    for (const latch of key.latches ?? []) {
      if (!latch.id) {
        continue;
      }
      out.push({
        uniqueId: `account:${key.id}:${latch.id}`,
        latchId: latch.id,
        keyId: key.id,
        name: latch.name || key.name || 'Gate',
        location: latch.location ?? undefined,
        offline: Boolean(latch.offline),
        heldOpen: Boolean(latch.heldOpen),
        scope: 'account',
        hasStatus: false,
      });
    }
  }
  return out;
}

function latchesFromGateStatus(status: GateStatus): DiscoveredLatch[] {
  const out: DiscoveredLatch[] = [];
  for (const latch of status.latches ?? []) {
    if (!latch.latchId) {
      continue;
    }
    out.push({
      uniqueId: `community:${latch.latchId}`,
      latchId: latch.latchId,
      name: latch.latchName || 'Gate',
      offline: Boolean(latch.offline),
      heldOpen: false,
      status: latch.status,
      scope: 'community',
      hasStatus: Boolean(latch.status) || (latch.possibleStatuses?.length ?? 0) > 0,
    });
  }
  return out;
}

export async function discoverLatches(api: NimbioApi): Promise<DiscoveryResult> {
  const me = await api.me();
  const type = (me.key?.type ?? '').toLowerCase();
  const scope: NimbioKeyScope = type === 'community' ? 'community' : 'account';

  if (scope === 'community') {
    const status = await api.communityGateStatus();
    return {
      scope,
      mode: me.key?.mode ?? null,
      accountId: me.accountId,
      latches: latchesFromGateStatus(status),
    };
  }

  const keys = await api.listAccountKeys();
  return {
    scope,
    mode: me.key?.mode ?? null,
    accountId: me.accountId,
    latches: latchesFromAccountKeys(keys),
  };
}

export async function openLatch(
  api: NimbioApi,
  latch: Pick<DiscoveredLatch, 'scope' | 'latchId' | 'keyId'>,
  note: string,
): Promise<void> {
  if (latch.scope === 'account') {
    if (!latch.keyId) {
      throw new Error(`Account latch ${latch.latchId} is missing keyId`);
    }
    await api.accountOpen(latch.keyId, latch.latchId, note);
    return;
  }
  await api.communityOpen(latch.latchId, note);
}
