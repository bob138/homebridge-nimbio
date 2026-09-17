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
3. Leave **Also pulse when closing** off unless your gate needs a second press to close.
4. Click **Save**.
5. **Restart Homebridge** when prompted.

That’s the only configuration required. The plugin discovers your gate(s) automatically from the API key.

### 4. Add the gate in Apple Home

1. Open the **Home** app on your iPhone or iPad.
2. Find the new garage door / gate accessory (named from Nimbio, e.g. “Front Gate”).
3. Tap it to open. The first open can take about 15–20 seconds while Nimbio reaches the cellular box.
4. Rename it in Home if you want (“Front Gate”, “Driveway”, etc.).

You can now use Siri (“Open the front gate”) and Home automations like any other HomeKit door.

---

## What to expect

- **Open** in Home → Homebridge asks Nimbio to open → the gate moves when the box confirms.
- Opening over cellular often takes **~15–20 seconds**. Wait for confirmation before trying again.
- HomeKit may show the gate as Open briefly, then Closed again. That reset is only in the Home app so you can open again; Nimbio’s API is a remote-style pulse, not a full open/close motor status feed for most homeowner setups.
- If your physical gate needs a second pulse to close, enable **Also pulse when closing** in the plugin settings and save / restart.

---

## Troubleshooting

| Problem | What to try |
|---|---|
| Gate never appears | Confirm the API key was saved, restart Homebridge, and check logs for `Nimbio` / `failed to discover`. |
| Gate appears but doesn’t move | Confirm the key is a **live** key (`nimbio_live_…`) with open permission, and that the same gate opens in the Nimbio app. |
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
