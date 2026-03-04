import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';

describe('CLI smoke test', () => {
  it('--help shows all subcommands', () => {
    const output = execFileSync('npx', ['tsx', 'src/index.ts', '--help'], {
      encoding: 'utf-8',
    });
    for (const cmd of ['init', 'add', 'batch', 'view', 'sync', 'alias']) {
      expect(output).toContain(cmd);
    }
  });
});
