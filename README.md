# homebridge-nimbio

Homebridge plugin that exposes **Nimbio** cellular smart gate openers in Apple HomeKit.

This plugin follows the [Homebridge Verified Plugins](https://github.com/homebridge/plugins/wiki/Verified-Plugins) guidelines (dynamic platform, Plugin Settings GUI, no analytics, and related requirements).

## Requirements

- [Homebridge](https://homebridge.io/) v1.8+ (or v2)
- Node.js **22** or **24** (current Homebridge-supported LTS versions)
- A Nimbio account with a **live** API key that can open your gate
- Network access from the Homebridge host to `https://api.nimbio.com`

## Installation

### Homebridge UI (recommended)

1. Open the Homebridge UI → **Plugins**.
2. Search for `homebridge-nimbio`.
3. Click **Install**, then open **Settings**.

The plugin does not start until you add and save a platform configuration (at minimum a live API key).

### Command line

On typical Raspberry Pi / `hb-service` installs:

```bash
cd /var/lib/homebridge
npm install homebridge-nimbio
```

Or globally:

```bash
sudo npm install -g homebridge-nimbio
```

Restart Homebridge after install. If `npm` reports permission errors, use the same user and path your other plugins use (often the `homebridge` user under `/var/lib/homebridge`).

## Configuration

### Nimbio API key

1. Sign in to the [Nimbio portal](https://nimbio.com/) with the account that opens the gate in the Nimbio app.
2. Open **API keys** / developer settings.
3. Create a **live** API key with permission to **open** the gate.
4. Copy the key when it is shown (format `nimbio_live_…`; it is only displayed once).

Use a **live** key. Test keys (`nimbio_test_…`) will not open the gate.

### Homebridge UI settings

1. Open **Plugins → Nimbio → Settings**.
2. Paste the API key into **Nimbio API Key** (the field is masked).
3. Set **Seconds until HomeKit shows Closed** to match how long the opener stays open before hardware auto-close (default **15**).
4. Leave **Also pulse when closing** off unless the gate needs a second press to close.
5. Click **Save** and restart Homebridge when prompted.

No latch IDs are required for the common case — the plugin discovers gate(s) from the API key. Optional advanced settings (accessory type, latch filters, timeouts, and related options) are available under **Advanced** in the plugin settings UI.

### Example `config.json` (advanced)

```json
{
  "platforms": [
    {
      "platform": "Nimbio",
      "name": "Nimbio",
      "apiKey": "nimbio_live_…",
      "autoCloseSeconds": 15,
      "pulseOnClose": false
    }
  ]
}
```

## Apple Home

1. Open the **Home** app.
2. Find the new garage door / gate accessory (named from Nimbio).
3. Tap to open. The first open can take about 15–20 seconds while Nimbio reaches the cellular box.
4. Rename the accessory in Home if desired.

Siri and Home automations work like any other HomeKit door.

## How open / closed status works

Many gate openers **auto-close in hardware** after a short open time. Nimbio’s homeowner API can **open** the gate, but it usually **cannot sense** when the gate has physically closed again.

This plugin handles that as follows:

1. **Open** in Home → Nimbio fires the gate → HomeKit shows **Opening**, then **Open**.
2. After **Seconds until HomeKit shows Closed** (default 15), HomeKit shows **Closing**, then **Closed** — matching a typical hardware auto-close.
3. Tune that value in plugin settings if the opener stays open longer or shorter.

If the installation uses a **community** API key with a physical sense line, the plugin prefers that live status instead of the timer.

Camera / HomeKit Secure Video feeds are **not** used for open/closed detection.

## What to expect

- **Open** in Home → Homebridge asks Nimbio to open → the gate moves when the box confirms.
- Opening over cellular often takes **~15–20 seconds**. Wait for confirmation before trying again.
- After a successful open, HomeKit returns to **Closed** on the timer above so status stays usable for the next open.
- If the physical gate needs a second pulse to close (instead of auto-closing), enable **Also pulse when closing**.

## Troubleshooting

| Problem | What to try |
|---|---|
| Gate never appears | Confirm the API key was saved, restart Homebridge, and check logs for `Nimbio` / `failed to discover`. |
| Gate appears but does not move | Confirm the key is a **live** key (`nimbio_live_…`) with open permission, and that the same gate opens in the Nimbio app. |
| HomeKit stays Open too long / too short | Adjust **Seconds until HomeKit shows Closed** to match the opener’s auto-close time, then save and restart. |
| “Not Responding” in Home | Check Homebridge is online and can reach `https://api.nimbio.com` (internet required — Nimbio is cellular/cloud). |
| Opens are very slow | Normal for cellular. Wait through the opening state; avoid repeated Open taps. |

Check Homebridge logs (**Status → Logs**) for lines mentioning `Nimbio` if something still fails.

## Security

- Treat the API key like a physical remote — anyone with it can open the gate.
- Enter it only in the Homebridge UI (or a private `config.json` on the Homebridge server). Never commit it to git or share it.
- Prefer a key scoped only to opening the intended gate.
- This plugin does not include analytics or user tracking.

## Support

Bug reports and feature requests: [GitHub Issues](https://github.com/bob138/homebridge-nimbio/issues).

See [CHANGELOG.md](CHANGELOG.md) for release notes.

## License

[Apache-2.0](LICENSE)
