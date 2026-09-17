# homebridge-nimbio

Control your **Nimbio** cellular smart gate from Apple HomeKit using Homebridge.

---

## Setup guide

Follow these steps once. When you’re done, your gate shows up in the Home app like any other garage door / gate.

### 1. Create a Nimbio API key

1. Sign in to the [Nimbio portal](https://nimbio.com/) (the same account that already opens your gate in the Nimbio app).
2. Open **API keys** / developer settings for your account.
3. Create a **live** API key with permission to **open** your gate.
4. Copy the key when it’s shown — it looks like `nimbio_live_…` and is only displayed once.

Use a **live** key. That key is what actually opens the gate.

### 2. Install the plugin in Homebridge

**Homebridge UI (recommended)**

1. Open the Homebridge UI in your browser.
2. Go to **Plugins**.
3. Search for `homebridge-nimbio`, or install from GitHub: `bob138/homebridge-nimbio`.
4. Click **Install** and wait until it finishes.

**Command line (optional)**

```bash
sudo npm install -g homebridge-nimbio
# or, from this repo:
sudo npm install -g github:bob138/homebridge-nimbio
```

### 3. Enter your API key in the Homebridge UI

1. After install, Homebridge opens the plugin settings (or go to **Plugins → Nimbio → Settings**).
2. Paste your Nimbio API key into **Nimbio API Key**.  
   The field is masked so the key stays private in the UI.
3. Set **Seconds until HomeKit shows Closed** to match how long your gate stays open before it auto-closes on its own (default **15**).
4. Leave **Also pulse when closing** off unless your gate needs a second press to close.
5. Click **Save**.
6. **Restart Homebridge** when prompted.

That’s the only configuration required. The plugin discovers your gate(s) automatically from the API key.

### 4. Add the gate in Apple Home

1. Open the **Home** app on your iPhone or iPad.
2. Find the new garage door / gate accessory (named from Nimbio, e.g. “Front Gate”).
3. Tap it to open. The first open can take about 15–20 seconds while Nimbio reaches the cellular box.
4. Rename it in Home if you want (“Front Gate”, “Driveway”, etc.).

You can now use Siri (“Open the front gate”) and Home automations like any other HomeKit door.

---

## How open / closed status works

Many gate openers (including yours) **auto-close in hardware** after a short open time. Nimbio’s homeowner API can **open** the gate, but it usually **cannot sense** when the gate has physically closed again.

This plugin handles that as follows:

1. You tap **Open** in Home → Nimbio fires the gate → HomeKit shows **Opening**, then **Open**.
2. After **Seconds until HomeKit shows Closed** (default 15), HomeKit shows **Closing**, then **Closed** — matching a typical hardware auto-close.
3. Tune that number in plugin settings if your opener stays open longer or shorter.

If your Nimbio installation uses a **community** API key with a physical sense line, the plugin will prefer that live status instead of the timer.

Camera / HomeKit Secure Video feeds are **not** used for open/closed detection (that would need separate video AI and is out of scope).

---

## What to expect

- **Open** in Home → Homebridge asks Nimbio to open → the gate moves when the box confirms.
- Opening over cellular often takes **~15–20 seconds**. Wait for confirmation before trying again.
- After a successful open, HomeKit returns to **Closed** on the timer above so status stays usable for the next open.
- If your physical gate needs a second pulse to close (instead of auto-closing), enable **Also pulse when closing**.

---

## Troubleshooting

| Problem | What to try |
|---|---|
| Gate never appears | Confirm the API key was saved, restart Homebridge, and check logs for `Nimbio` / `failed to discover`. |
| Gate appears but doesn’t move | Confirm the key is a **live** key (`nimbio_live_…`) with open permission, and that the same gate opens in the Nimbio app. |
| HomeKit stays Open too long / too short | Adjust **Seconds until HomeKit shows Closed** to match your opener’s auto-close time, then save and restart. |
| “Not Responding” in Home | Check Homebridge is online and can reach `https://api.nimbio.com` (internet required — Nimbio is cellular/cloud). |
| Opens are very slow | Normal for cellular. Keep waiting through the opening state; don’t spam Open. |

Check Homebridge logs (**Status → Logs**) for lines mentioning `Nimbio` if something still fails.

---

## Security

- Treat the API key like a physical remote — anyone with it can open your gate.
- Enter it only in the Homebridge UI (or your private `config.json` on the Homebridge server). Never commit it to git or share it.
- Prefer a key scoped only to opening your gate.

---

## License

Apache-2.0
