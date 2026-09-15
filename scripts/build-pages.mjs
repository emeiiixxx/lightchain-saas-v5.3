import { execFileSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = '/lightchain-saas-v5.3/';
execFileSync('npm', ['run', 'build', '--', '--base', base], { stdio: 'inherit' });
// Public asset URLs in demo fixtures are root-relative for local development.
// Scope only these literals in the published output to the GitHub project path.
async function scopeAssets(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await scopeAssets(file);
    else if (/\.(?:html|css|js)$/.test(entry.name)) {
      const source = await readFile(file, 'utf8');
      const scoped = source.replace(/(["'`(])\/assets\//g, `$1${base}assets/`);
      if (source !== scoped) await writeFile(file, scoped);
    }
  }
}
await scopeAssets('dist');
