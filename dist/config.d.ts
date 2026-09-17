export type AccessoryKind = 'garageDoor' | 'switch';
export interface NimbioPlatformConfig {
    name?: string;
    /** Nimbio API key (`nimbio_live_…` or `nimbio_test_…`). Account or community scoped. */
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
     * How long (seconds) a momentary gate stays "Open" in HomeKit after a
     * successful open when no physical sense line is available. Default 25.
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
export declare function resolveConfig(config: NimbioPlatformConfig): ResolvedConfig;
