import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { RedmineConfig } from '../types.js';

export const CONFIG_DIR_NAME = 'redmine-log';
export const CONFIG_FILE = 'config.json';
export const CACHE_FILE = 'cache.json';
export const ALIASES_FILE = 'aliases.json';

export function getConfigDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg || path.join(os.homedir(), '.config');
  return path.join(base, CONFIG_DIR_NAME);
}

export function loadConfig(): RedmineConfig | null {
  const p = path.join(getConfigDir(), CONFIG_FILE);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as RedmineConfig;
}

export function saveConfig(config: RedmineConfig): void {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(
    path.join(dir, CONFIG_FILE),
    JSON.stringify(config, null, 2),
    { encoding: 'utf-8', mode: 0o600 },
  );
}
