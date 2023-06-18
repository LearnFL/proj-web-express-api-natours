import { fileURLToPath } from 'url';
import { dirname } from 'path';

export function currDir() {
  // eslint-disable parsing
  const __filename = fileURLToPath(import.meta.url); // eslint-disable-line
  return dirname(__filename);
}
