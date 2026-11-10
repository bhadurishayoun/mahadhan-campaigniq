# Mockup and data gaps

The web app now reproduces all screens in `ui-mockups/Sayak's Mockups/` (see [screen-inventory.md](./screen-inventory.md)). Their figures, AI insights and recommendations are the mockups' illustrative content, held in the screen components.

Extension points are in place so this content can be replaced without redesigning the screens (see the README, section 5):

- **Masters:** states, districts, talukas, products, crops, seasons and campaign types come from `server/data/reference/*.json` via `GET /api/reference`. Only Jalna (Maharashtra) is marked `has_data`; the other states and districts are placeholders.
- **Screen datasets:** 12 key tables use `useDataset()` and switch from demo rows to uploaded rows (`/api/datasets`). The remaining panels (KPI tiles, funnels, charts, S2.3/S2.4, S3.1–S3.3, S4, S5.4, S6.2, S7.2 factors and learnings) are still hard-coded and need catalog entries.
- **AI Co-pilot:** `POST /api/copilot/ask` calls the configured LLM (OpenAI, Azure OpenAI or OpenAI-compatible) with grounded context. With `COPILOT_PROVIDER=demo` the screen shows the canned example answers.

## Frontend integration still required

- Declare and connect the remaining screen datasets listed above, then load real feeds: market/atlas, segmentation, competition, crop-stage, demand, stock/ERP, retailer, execution and impact.
- Connect S4.3/S4.4/S4.5 to `POST /api/plans/calculate`, plan save/submit/approve and calendar generation. The backend endpoints exist, but the mockup's activity economics differ from the seeded engine inputs.
- Implement `retrieve_documents()` (`server/campaign_api/copilot/context.py`) against an approved knowledge base, and choose and approve the production LLM.
- Protect the admin endpoints (`PUT /api/reference/*`, `POST`/`DELETE /api/datasets/*`) with authentication. They are currently open, like the rest of the demo API.

## Outstanding product/data inputs

- **Authentication and geography scope:** Users, role permissions, and row-level access by MU/territory are not implemented. Approval endpoints check the supplied `X-User-Role` header, which is not an authentication mechanism and must not be used as production authorization.
- **Geographic maps:** Market tables and opportunity bars work, but state/district/MU map layers need approved boundary GeoJSON and a validated MU centroid dataset. The competition and conversion indexes shown in the mockup need an approved source and definition.
- **Crop calendar accuracy:** Seeded crop stages and product doses are illustrative. Replace them with approved crop-specific stage dates, dose schedules, anchor dates, lead times and holidays before generating operational calendars or stock commitments.
- **Weather replanting:** The risk endpoint uses the seeded rainfall deviation and date threshold. A production weather feed and authorized source/as-of metadata are needed.
- **Field evidence:** Event reporting stores GPS coordinates and a photo hash, but does not upload photo files, verify the photo content, validate a 10 km MU-centroid distance, or support robust offline synchronization/idempotency.
- **Forecast accuracy:** The KPI remains `null` until a forecast snapshot can be compared with confirmed actual sales for the same scope and time period.
- **Campaign ROI estimate:** Returned as `null` with an explanation. The system needs a defensible matched non-campaign baseline, sales growth definition and spend attribution before showing ROI.
- **Sayak screen logic:** Agronomic rules (stage windows, product fit, programme validation), trigger/recommendation scoring, opportunity and readiness scores, competitor ratings and the recovery/replanning impact estimates are shown as designed values. Their formulas and sources need confirmation before they are computed.
- **Maps:** Heatmaps are stylised illustrations, not geographic boundaries.

## Illustrative seed inputs

The demo seed labels market data as illustrative. Croptek prices, pack sizes, doses, market areas, AMP, treated shares, competition notes, soil deficiencies, rainfall deviation, dealers, sample callback outcomes, event reports and demo yield are placeholders. Import approved values before business decisions.
