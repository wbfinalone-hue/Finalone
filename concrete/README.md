# ConcreteIQ — Real AI Aggregate Detector & Strength Predictor

Single-file static web app (no backend, no build step) that runs **real AI image classification entirely in the browser** using TensorFlow.js + MobileNet v2.

## What was fixed

### 1. Aggregate vs non-aggregate detection (real AI)
Switched the detection pipeline so it is **AI-authoritative** rather than CV-authoritative.

- **MobileNet v2 (alpha 1.00)** is loaded from a public CDN and run on every uploaded image directly on the user's device. The 1.00 alpha (~14 MB, full-accuracy) gives reliable classification of clothes, faucets, trees, indoor scenes, vehicles, etc.
- Verdict logic is **default-deny**. An image is accepted **only if** at least one top-5 prediction (≥ 5 % confidence) matches an aggregate-related ImageNet class (`cobblestone`, `stone wall`, `rocks/scree`, `cliff`, `gravel pit`, `quarry`, …).
- Any top-5 prediction (≥ 8 %) that hits the non-aggregate keyword list (clothing, sprinkler, faucet, tap, hose, flower-pot, hanger, screen, scaffolding, fence, monitor, person, plant, vehicle, …) → instantly rejected.
- A confident top-1 (> 40 %) outside both lists also rejects.
- The local CV engine is now **only** used to estimate aggregate **size** and **quality score** for already-accepted images — it can no longer overrule the AI.

### 2. Strength prediction follows the target grade
Per-image predicted 28-day compressive strength is now driven directly by the `Target Concrete Grade` dropdown:

```
predicted_28d = clamp( target_fck × (quality_score / 100),
                      target_fck × 0.90,
                      target_fck × 1.10 )
```

- M30 selected → every accepted image predicts **27.0 – 33.0 MPa**
- M80 selected → every accepted image predicts **72.0 – 88.0 MPa**
- 7-day = 28d × 0.65 · 14-day = 28d × 0.85 (IS 456 ratios)
- Changing the target grade in the UI **live-updates every accepted image** (no re-upload).

### 3. GitHub Pages-ready
Pure static — works on GitHub Pages, Netlify, Cloudflare Pages, or `file://`. Only CDN dependency is the TensorFlow.js model.

## Deploy to GitHub Pages

1. Create a new GitHub repo (or use an existing one).
2. Drop **`index.html`** into the repo root (the `worker.js` file is only needed for Cloudflare Workers — GitHub Pages doesn't use it, leave it or remove it).
3. Commit & push.
4. **Settings → Pages → Build and deployment** → set _Source_ to `Deploy from a branch`, branch = `main`, folder = `/ (root)` → **Save**.
5. Wait ~30 s — your app is live at `https://<username>.github.io/<repo>/`.

> First image takes 5–15 s while MobileNet (~14 MB) downloads and warms up. Subsequent images analyse in < 1 s. Pre-load happens automatically the moment you open the AI Detector tab.

## Local preview

```bash
python3 -m http.server 8765
# open http://localhost:8765/index.html
```

The model still loads (browsers fetch the CDN over the network) — just keep the dev server running.

## Tech stack

| Layer | Tech |
|---|---|
| Image classification | `@tensorflow/tfjs` 4.20 + `@tensorflow-models/mobilenet` 2.1 (v2 / alpha 1.00) |
| Size / quality scoring | Custom in-browser CV (Sobel edges + block variance + colour stats) |
| Strength formula | IS 456:2000 ratios + ±10 % clamp around target fck |
| Hosting | GitHub Pages / any static host |

No build, no npm, no API keys, no server.
