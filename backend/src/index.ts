import fs from 'node:fs';
import { env, uploadsAbsolutePath } from './config/env.js';
import { createApp } from './app.js';

fs.mkdirSync(uploadsAbsolutePath, { recursive: true });

const app = createApp();

app.listen(env.port, () => {
  console.log(`WorldofNovel API listening on http://localhost:${env.port}`);
});