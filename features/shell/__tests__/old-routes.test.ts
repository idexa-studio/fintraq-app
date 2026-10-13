import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Paths the shipped app has put outside itself: in launcher shortcuts people pinned, in scheduled
 * notifications, in store links. Each must keep a route file for good, or a tap from an old
 * shortcut lands on "page not found". Where each one sends the user is in docs/SCREENS.md.
 */
const OLD_PATHS: [path: string, routeFile: string][] = [
  ['/transactions/create?type=DR', 'app/transactions/create.tsx'],
  ['/transactions/edit/12', 'app/transactions/edit/[id].tsx'],
  ['/transactions?accountId=3', 'app/transactions/index.tsx'],
  ['/(main)/loans/form', 'app/(main)/loans/form.tsx'],
  ['/persons', 'app/(main)/persons/index.tsx'],
  ['/persons/4', 'app/(main)/persons/[id].tsx'],
  ['/premium?feature=backup', 'app/premium.tsx'],
  ['/analytics', 'app/(main)/analytics.tsx'],
  ['/backup', 'app/(main)/backup.tsx'],
  ['/export', 'app/(main)/export.tsx'],
];

describe('paths of the shipped app', () => {
  it.each(OLD_PATHS)('%s still has a route', (_path, routeFile) => {
    expect(existsSync(join(process.cwd(), routeFile))).toBe(true);
  });
});
