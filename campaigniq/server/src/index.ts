import 'dotenv/config';
import { createApp } from './app';
import { migrateLatest } from './db/migrate';

const port = Number(process.env.PORT ?? 4000);

await migrateLatest();
const app = await createApp();
app.listen(port, () => {
  console.log(`CampaignIQ API listening on http://localhost:${port}`);
});
