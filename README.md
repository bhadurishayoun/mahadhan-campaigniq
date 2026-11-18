# Mahadhan CampaignIQ

Crop-nutrition campaign management tool: opportunity atlas, crop-stage nutrition calendar, campaign
studio, demand & channel readiness, execution control tower, impact & learning, and an AI co-pilot -
with district-level India maps (790 districts, Government of India boundary).

**Live site: [https://bhadurishayoun.github.io/mahadhan-campaigniq/](https://bhadurishayoun.github.io/mahadhan-campaigniq/)** ·
sign in with `MASTER001` / `Mahadhan@2026`

All data in the tool is illustrative (mockup figures and a synthetic data workbook), not Mahadhan's actual data.

> **New developer? Start with [Project status & next steps](campaigniq/README.md#0-project-status--next-steps-start-here)**:
> what is done, what is still illustrative, known limitations and the prioritised to-do list.

## What's in this repository

| Folder / file | What it is |
|---|---|
| `campaigniq/web/` | The web app (React + Vite). This is what GitHub Pages publishes. |
| `campaigniq/web/public/geo/` | India district / taluka boundary data used by the maps ([sources](campaigniq/web/public/geo/README.md)) |
| `campaigniq/server/` | Python (FastAPI) backend for the live planning engine, data uploads and AI co-pilot |
| `campaigniq/server/data/seed/mahadhan_synthetic_data.xlsx` | Synthetic data workbook the backend loads on start ([how it works](campaigniq/README.md#53-replace-demo-data-with-real-data)) |
| `campaigniq/README.md` | Detailed technical documentation of the app |
| `.github/workflows/deploy.yml` | Builds the web app and publishes it to GitHub Pages on every push to `main` |
| `render.yaml` | One-click setup of the backend on Render's free tier |
| `*.docx`, `*.pptx`, `*.md`, `ui-mockups/` | Product briefs, analysis and UI mockups (`ui-mockups/V2-persona-mockup-specs.md` holds the V2 persona-wise screen specs) |

**Personas (V2):** the avatar menu at the top-right switches among the dedicated Business Head, Product Manager
(PM.1 – PM.AI1, 48 screens), Territory Manager (17 screens: My Plan, My Campaigns with the campaign wizard, review &
approval and campaign portfolio, Execution, Impact, AI Copilot) and Marketing Head workspaces.

**AI Copilot:** every copilot (AI.1 and the TM / PM / MH / BH copilots) answers live with a free, keyless LLM - no API
key needed. Free services are rate-limited, so answers take 5–30 seconds and rapid-fire questions may need a short
wait. See [section 5.5](campaigniq/README.md#55-connect-the-ai-copilot-to-an-llm) to switch to a paid model.

**Showcase login:** user ID `MASTER001`, password `Mahadhan@2026` opens every persona. Sign in with any persona tile
selected; the avatar menu then switches personas without signing in again. The per-persona IDs (SH001, PM001,
TM001, MH001) still work and stay limited to their own persona. These are demo credentials kept in the front end,
not real security. The legacy module screens remain
available through their existing routes; see `campaigniq/docs/product-manager-persona.md` for the PM build notes.

## How it is hosted

* **Website - GitHub Pages (free):** every push to `main` builds `campaigniq/web` and publishes it.
  All dashboard screens and maps work on their own with built-in demo data.
* **Backend - Render (free, connected):** the three *Prototype Showcase* screens (live planning engine),
  CSV uploads and backend-grounded AI answers need the Python API. It runs on Render at
  `https://mahadhan-campaigniq-api.onrender.com`, and the website connects to it by default (override with the
  repository variable `VITE_API_URL`). If the backend is asleep or unreachable the site still works: dashboards use
  built-in data and the AI Copilot calls the free LLM directly from the browser.
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
* The AI co-pilot uses free keyless LLM endpoints by default (`COPILOT_PROVIDER=free`). To use a paid model, set
  `COPILOT_PROVIDER=openai` and put `COPILOT_API_KEY` in the **Render dashboard** (Environment), never in the code or
  in GitHub.
* `VITE_API_URL` (the backend address) is not secret - it is visible in the published site - and is set as a
  GitHub repository *variable*.
