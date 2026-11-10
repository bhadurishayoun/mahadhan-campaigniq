# Mahadhan CampaignIQ

Crop-nutrition campaign management tool: opportunity atlas, crop-stage nutrition calendar, campaign
studio, demand & channel readiness, execution control tower, impact & learning, and an AI co-pilot -
with district-level India maps (790 districts, Government of India boundary).

**Live site:** https://&lt;your-username&gt;.github.io/mahadhan-campaigniq/
(replace `<your-username>` with your GitHub username once it is published - see [DEPLOYMENT.md](DEPLOYMENT.md))

All data in the tool is illustrative.

## What's in this repository

| Folder / file | What it is |
|---|---|
| `campaigniq/web/` | The web app (React + Vite). This is what GitHub Pages publishes. |
| `campaigniq/web/public/geo/` | India district / taluka boundary data used by the maps ([sources](campaigniq/web/public/geo/README.md)) |
| `campaigniq/server/` | Python (FastAPI) backend for the live planning engine, data uploads and AI co-pilot |
| `campaigniq/README.md` | Detailed technical documentation of the app |
| `.github/workflows/deploy.yml` | Builds the web app and publishes it to GitHub Pages on every push to `main` |
| `render.yaml` | One-click setup of the backend on Render's free tier |
| `*.docx`, `*.pptx`, `*.md`, `ui-mockups/` | Product briefs, analysis and UI mockups |

## How it is hosted

* **Website - GitHub Pages (free):** every push to `main` builds `campaigniq/web` and publishes it.
  All dashboard screens and maps work on their own with built-in demo data.
* **Backend - Render (free, optional):** the three *Prototype Showcase* screens (live planning engine),
  CSV uploads and a real AI model need the Python API. It runs on Render; the website finds it through the
  repository variable `VITE_API_URL`. Without it the site still works as a static demo.
  The free Render server sleeps when idle - the first visit after a while can take up to a minute.

Step-by-step setup: **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Run it on your computer

Requirements: [Node.js](https://nodejs.org/) 20 or newer and [Python](https://www.python.org/) 3.11 or newer.

```bash
cd campaigniq
npm install                                   # web + tooling dependencies
pip install -r server/requirements.txt        # backend dependencies
npm run dev                                   # starts the API (port 8000) and the web app (port 5173)
```

Open http://localhost:5173. To run only the website (demo data, no backend): `npm run dev -w web`.

Build the static site exactly as GitHub Pages does: `npm run build -w web` (output in `campaigniq/web/dist`).

## Configuration and secrets

* Copy `campaigniq/.env.example` to `campaigniq/server/.env` for local settings. `.env` files are ignored
  by Git and must never be committed.
* The AI co-pilot runs in `demo` mode without any key. To connect a real model, put `COPILOT_API_KEY` in the
  **Render dashboard** (Environment), never in the code or in GitHub.
* `VITE_API_URL` (the backend address) is not secret - it is visible in the published site - and is set as a
  GitHub repository *variable*.
