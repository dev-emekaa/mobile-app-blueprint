/**
 * What mobile-app-blueprint ships, defined once — read by the installer and by the folder build.
 */
import { readFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ASSETS = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

export const STACK_LABEL = 'Expo · React Native · TypeScript · Tailwind CSS (Uniwind) · React Native Reusables · TanStack Query';

/** Rules every project gets. */
export const RULES = [
  'documentation-conventions.md',
  'tech-stack.md',
  'coding-standards.md',
  'security.md',
  'testing.md',
  'ci-cd.md',
];

/** Rules only some projects get. */
export const OPTIONAL_RULES = { analytics: 'analytics.md' };

/** Folders under docs/ the installer creates. feature-areas.md is never created: it arrives from the backend. */
export const DOC_DIRS = [
  'product-docs',
  'business-rules',
  'app-flows',
  'screen-specs',
  'api-docs',
  'api-testing',
  'design/screens',
  'integration-handoff',
  'infra',
  'release',
];

/** The CLAUDE.md blocks, with the stack filled in. */
export async function claudeTemplate() {
  const template = await readFile(join(ASSETS, 'templates', 'CLAUDE.md'), 'utf8');
  return template.replaceAll('{{STACK}}', STACK_LABEL);
}
