import { createApp } from './app.js';
import { createDb } from './database.js';

const port = Number(process.env.PORT || 3000);
const db = createDb(process.env.DB_FILE || 'data/projects.json');
const app = createApp(db);

app.listen(port, () => console.log(`Open http://localhost:${port}`));