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

export function displayNameForLatch(
  latch: Pick<DiscoveredLatch, 'latchId' | 'name'>,
  opts: { namePrefix?: string; latchNames?: Record<string, string> },
): string {
  const override = opts.latchNames?.[latch.latchId];
  const base = (override || latch.name || `Latch ${latch.latchId}`).trim();
  const prefix = opts.namePrefix ?? '';
  return prefix ? `${prefix}${base}` : base;
}

export function filterLatches(
  latches: DiscoveredLatch[],
  latchIds: Set<string> | null,
): DiscoveredLatch[] {
  if (!latchIds) {
    return latches;
  }
  return latches.filter(l => latchIds.has(l.latchId));
}

/**
 * Map a Nimbio gate-status string to a coarse open/closed/moving bucket.
 * Community sense lines use free-form vocabularies; we classify conservatively.
 */
export type DoorBucket = 'open' | 'closed' | 'opening' | 'closing' | 'stopped' | 'unknown';

export function classifyGateStatus(status: string | null | undefined): DoorBucket {
  if (!status) {
    return 'unknown';
  }
  const s = status.trim().toLowerCase();
  if (!s) {
    return 'unknown';
  }
  if (/(opening|opening…|opening\.\.\.)/.test(s)) {
    return 'opening';
  }
  if (/(closing|closing…|closing\.\.\.)/.test(s)) {
    return 'closing';
  }
  if (/(^|\b)(open|opened|unlocked|held[\s_-]?open)(\b|$)/.test(s)) {
    return 'open';
  }
  if (/(^|\b)(closed|close|locked|secure)(\b|$)/.test(s)) {
    return 'closed';
  }
  if (/(stopped|obstruct|fault|error|jam)/.test(s)) {
    return 'stopped';
  }
  return 'unknown';
}
