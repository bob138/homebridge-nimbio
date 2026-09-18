import { createRequire } from 'node:module';

/**
 * Platform name used in Homebridge config.json.
 */
export const PLATFORM_NAME = 'Nimbio';

/**
 * Must match the package.json `name` property.
 */
export const PLUGIN_NAME = 'homebridge-nimbio';

export const MANUFACTURER = 'Nimbio';
export const MODEL = 'Cellular Gate Opener';

const require = createRequire(import.meta.url);
export const PLUGIN_VERSION: string = require('../package.json').version;
