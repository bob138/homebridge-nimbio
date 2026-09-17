export type AccessoryKind = 'garageDoor' | 'switch';

export interface NimbioPlatformConfig {
  name?: string;
  /** Nimbio live API key (`nimbio_live_…`). Account or community scoped. */
  apiKey?: string;
  /** Optional override for the API base URL (defaults to production). */
  baseUrl?: string;
  /** Optional list of latch IDs to expose. Empty/omitted = all latches. */
  latchIds?: string[];
  /** Optional display-name overrides keyed by latch ID. */
  latchNames?: Record<string, string>;
  /** Prefix applied to discovered latch names. */
  namePrefix?: string;
  /**
   * How long (seconds) HomeKit keeps the gate shown as Open after a successful
   * open when Nimbio cannot report physical closed state. Match this to your
   * gate opener's hardware auto-close. Default 15.
   */
  autoCloseSeconds?: number;
  /**
   * Community keys only: poll interval for `gate-status`. Default 30.
   * Set to 0 to disable polling.
   */
  pollIntervalSeconds?: number;
  /**
   * When true, asking HomeKit to close also fires a Nimbio open (useful for
   * operators that toggle on each pulse). Default false.
   */
  pulseOnClose?: boolean;
  /**
   * HomeKit accessory type. `garageDoor` is the usual gate control.
   * `switch` exposes a momentary On that fires open then returns Off.
   */
  accessoryType?: AccessoryKind;
  /** Note stored with each API open. Default "HomeKit". */
  openNote?: string;
  /** Request timeout in seconds for Nimbio opens (they can take ~15–18s). Default 45. */
  timeoutSeconds?: number;
  [key: string]: unknown;
}

export interface ResolvedConfig {
  name: string;
  apiKey: string;
  baseUrl?: string;
  latchIds: Set<string> | null;
  latchNames: Record<string, string>;
  namePrefix: string;
  autoCloseSeconds: number;
  pollIntervalSeconds: number;
  pulseOnClose: boolean;
  accessoryType: AccessoryKind;
  openNote: string;
  timeoutSeconds: number;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(v => String(v).trim()).filter(Boolean);
}

function asStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'string' && v.trim()) {
      out[k] = v.trim();
    }
  }
  return out;
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export function resolveConfig(config: NimbioPlatformConfig): ResolvedConfig {
  const apiKey = typeof config.apiKey === 'string' ? config.apiKey.trim() : '';
  if (!apiKey) {
    throw new Error('Enter your Nimbio API key in the Homebridge plugin settings.');
  }

  const accessoryType = config.accessoryType === 'switch' ? 'switch' : 'garageDoor';
  const latchIdList = asStringArray(config.latchIds);

  return {
    name: typeof config.name === 'string' && config.name.trim() ? config.name.trim() : 'Nimbio',
    apiKey,
    baseUrl: typeof config.baseUrl === 'string' && config.baseUrl.trim() ? config.baseUrl.trim() : undefined,
    latchIds: latchIdList.length ? new Set(latchIdList) : null,
    latchNames: asStringMap(config.latchNames),
    namePrefix: typeof config.namePrefix === 'string' ? config.namePrefix : '',
    autoCloseSeconds: clampInt(config.autoCloseSeconds, 15, 5, 600),
    pollIntervalSeconds: clampInt(config.pollIntervalSeconds, 30, 0, 3600),
    pulseOnClose: Boolean(config.pulseOnClose),
    accessoryType,
    openNote: typeof config.openNote === 'string' && config.openNote.trim() ? config.openNote.trim() : 'HomeKit',
    timeoutSeconds: clampInt(config.timeoutSeconds, 45, 15, 120),
  };
}
