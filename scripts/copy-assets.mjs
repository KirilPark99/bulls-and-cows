import { copyFileSync } from 'node:fs';

for (const file of ['index.html', 'style.css']) {
  copyFileSync(file, `dist/${file}`);
}
