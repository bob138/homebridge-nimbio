# Changelog

All notable changes to this project are documented in this file.

## [1.1.0] - 2026-09-18

### Changed

- Align Node.js engine support with current Homebridge LTS requirements (`^22.10.0 || ^24.0.0`).
- Remove the `prepare` install script so installs do not run a local TypeScript build (published `dist/` is used as-is).
- Expand `config.schema.json` with an Advanced section covering accessory type, latch filters, timeouts, and related options.
- Report accessory `FirmwareRevision` from the package version.
- Polish README for verified-plugin guidelines (without claiming verified status).

### Fixed

- Normalize `package.json` repository URL to the standard GitHub form used by the Homebridge plugin template.

## [1.0.1] - Previous

Public npm release with UI-oriented setup and HomeKit auto-close timing for typical Nimbio homeowner keys.
