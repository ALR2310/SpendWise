import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_LANG = 'en';
const TARGET_LANG = 'vi';

const baseLangPath = path.resolve(__dirname, `../src/assets/locale/${BASE_LANG}.json`);
const targetLangPath = path.resolve(__dirname, `../src/assets/locale/${TARGET_LANG}.json`);

let syncTimeout: NodeJS.Timeout | null = null;

function syncLocales() {
  let baseLang = {};

  try {
    baseLang = JSON.parse(fs.readFileSync(baseLangPath, 'utf-8'));
  } catch {
    return;
  }

  let targetLang: Record<string, any> = {};
  if (fs.existsSync(targetLangPath)) {
    try {
      targetLang = JSON.parse(fs.readFileSync(targetLangPath, 'utf-8'));
    } catch {
      return;
    }
  }

  function syncKeys(base: Record<string, any>, target: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key in base) {
      if (typeof base[key] === 'object') {
        result[key] = syncKeys(base[key], target[key] || {});
      } else {
        result[key] = target[key] !== undefined ? target[key] : base[key];
      }
    }

    return result;
  }

  const updatedLang = syncKeys(baseLang, targetLang);

  try {
    fs.writeFileSync(targetLangPath, JSON.stringify(updatedLang, null, 2), 'utf-8');
  } catch {}
}

chokidar.watch(baseLangPath, { usePolling: true }).on('change', () => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(syncLocales, 5000);
});
