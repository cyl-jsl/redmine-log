import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadConfig, saveConfig, getConfigDir } from '../lib/config.js';
import fs from 'node:fs';

vi.mock('node:fs');

describe('config', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

  it('getConfigDir returns ~/.config/redmine-log by default', () => {
    const dir = getConfigDir();
    expect(dir).toMatch(/\.config\/redmine-log$/);
  });

  it('loadConfig returns null when file missing', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(loadConfig()).toBeNull();
  });

  it('loadConfig parses valid JSON', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ url: 'https://r.test', apiKey: 'abc' })
    );
    expect(loadConfig()).toEqual({ url: 'https://r.test', apiKey: 'abc' });
  });

  it('saveConfig creates dir with 0o700 and file with 0o600', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined);
    saveConfig({ url: 'https://r.test', apiKey: 'key' });
    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true, mode: 0o700 });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      { encoding: 'utf-8', mode: 0o600 },
    );
  });
});
