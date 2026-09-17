# homebridge-nimbio

Homebridge plugin that exposes **Nimbio** cellular smart gate openers in Apple HomeKit.

It talks to the official [Nimbio Public API](https://api.nimbio.com/) using `@nimbio/community-api`, discovers latches on your API key, and publishes each one as a HomeKit **Garage Door Opener** (or optional momentary **Switch**).

## How it works

| API key type | Discovery | Open | Physical status |
|---|---|---|---|
| **Account** (`type: account`) — typical homeowner | `GET /v1/account/keys` | `POST /v1/account/keys/{key}/latches/{latch}/open` | Not available — HomeKit uses a momentary open, then auto-closes after `autoCloseSeconds` |
| **Community** (`type: community`) — community manager | `GET /v1/community/gate-status` | `POST /v1/community/latches/{latch}/open` | Polled when sense lines are configured |

Nimbio opens are **synchronous** over cellular and often take ~15–18 seconds for the box to confirm. The plugin waits for that confirmation before marking the gate Open in HomeKit.

## Prerequisites

1. A Nimbio gate / latch on your account (or community).
2. An API key from the Nimbio portal:
   - Prefer an **account** key with the `open` capability for a personal gate.
   - Start with a `nimbio_test_…` key while wiring Homebridge (opens are simulated).
   - Switch to `nimbio_live_…` when you want real opens.
3. Homebridge **1.8+** (or 2.x) on Node **18+**.

## Install

### Homebridge UI

1. Plugins → search / install from GitHub: `bob138/homebridge-nimbio`  
   (or install after publishing to npm as `homebridge-nimbio`).
2. Configure the platform (see below).
3. Restart Homebridge.

### CLI

```bash
# From npm (once published)
sudo npm install -g homebridge-nimbio

# Or directly from this repo
sudo npm install -g github:bob138/homebridge-nimbio
```

## Configuration

Example `config.json` platform block:

```json
{
  "platforms": [
    {
      "platform": "Nimbio",
      "name": "Nimbio",
      "apiKey": "nimbio_live_YOUR_KEY_HERE",
      "accessoryType": "garageDoor",
      "autoCloseSeconds": 25,
      "pulseOnClose": false,
      "openNote": "HomeKit"
    }
  ]
}
```

### Options

| Field | Required | Default | Description |
|---|---|---|---|
| `apiKey` | yes | — | Nimbio bearer key (`nimbio_live_…` / `nimbio_test_…`) |
| `accessoryType` | no | `garageDoor` | `garageDoor` or `switch` |
| `latchIds` | no | all | Only expose these latch IDs |
| `latchNames` | no | — | Map of latch ID → HomeKit name |
| `namePrefix` | no | `""` | Prefix for discovered names |
| `autoCloseSeconds` | no | `25` | Momentary HomeKit “Open” duration when no sense line |
| `pollIntervalSeconds` | no | `30` | Community gate-status poll interval (`0` = off) |
| `pulseOnClose` | no | `false` | Also fire Nimbio open when HomeKit asks to close (toggle operators) |
| `openNote` | no | `HomeKit` | Note stored on Nimbio access logs |
| `timeoutSeconds` | no | `45` | HTTP timeout for open calls |
| `baseUrl` | no | production | Override API base URL |

## HomeKit behavior

- **Open** in the Home app → Nimbio latch open → shows Opening, then Open when the box confirms.
- Without a sense line, the accessory returns to **Closed** after `autoCloseSeconds` so you can open again. This is display-only; it does not send a close command (Nimbio’s public open API is a pulse/open, not a bidirectional door motor API).
- Enable **Pulse on Close** if your gate operator needs a second pulse to close.
- Offline latches report **Obstruction Detected**.

## Siri / automations

Once the accessory appears in the Home app you can say “Open the front gate” or add it to automations / scenes like any other garage door.

## Development

```bash
npm install
npm test
npm run build
```

## Security notes

- Treat the API key like a physical remote. Prefer a least-privilege key with only `open`.
- Keep Homebridge on your LAN; do not commit live keys to git.
- Test keys never fire hardware — useful for verifying discovery before going live.

## License

Apache-2.0
