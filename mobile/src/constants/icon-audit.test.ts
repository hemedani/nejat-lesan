import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { AppIcons, iconProps } from './icon-map';

/**
 * Guards a whole class of bug, not one call site.
 *
 * `AppIcons.map.route.name` throws away the family, the component falls back to
 * Ionicons, and a MaterialCommunityIcons name renders as an invisible box plus a
 * `"directions-fork" is not a valid icon name for family "ionicons"` warning.
 * Ionicons names mask the mistake silently, so it only surfaces on the handful
 * of icons that actually cross families — hence the audit rather than a fix
 * someone has to remember.
 */

type Spec = { family: string; name: string };

function lookup(group: string, name: string): Spec | undefined {
  // The registry nests two levels deep; the cast is safe because every leaf is
  // an IconSpec, which is what the `?.` guard below re-checks at runtime.
  const groups = AppIcons as unknown as Record<string, Record<string, Spec>>;
  const entry = groups[group]?.[name];
  return entry && typeof entry.family === 'string' && typeof entry.name === 'string' ? entry : undefined;
}

/**
 * Every `<group>.<name>.name` usage, with the surrounding JSX prop block.
 *
 * A prop block, not a line: `icon` and `iconFamily` routinely land on separate
 * lines, so a line-scoped check reports correct code as broken.
 */
function usages(): { file: string; group: string; name: string; block: string }[] {
  const found: { file: string; group: string; name: string; block: string }[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (full.endsWith('.tsx')) {
        const lines = readFileSync(full, 'utf8').split('\n');
        lines.forEach((text, index) => {
          for (const match of text.matchAll(/AppIcons\.([A-Za-z]+)\.([A-Za-z]+)\.name\b/g)) {
            found.push({
              block: lines.slice(Math.max(0, index - 6), index + 7).join('\n'),
              file: full,
              group: match[1],
              name: match[2],
            });
          }
        });
      }
    }
  };
  walk('src');
  return found;
}

describe('icon family audit', () => {
  it('never passes a non-Ionicons icon without its family', () => {
    const offenders = usages()
      .filter(usage => {
        const spec = lookup(usage.group, usage.name);
        if (!spec || spec.family === 'ion') {
          return false;
        }
        // A sibling `.family` on the same element is fine; that is the correct
        // manual form. So is the `iconProps` helper, which carries both.
        const carriesFamily =
          usage.block.includes(`${usage.group}.${usage.name}.family`) || usage.block.includes('iconProps(');
        return !carriesFamily;
      })
      .map(usage => ({
        family: lookup(usage.group, usage.name)!.family,
        hint: 'pass iconProps(AppIcons.g.n) or add iconFamily={AppIcons.g.n.family}',
        where: usage.file,
      }));
    expect(offenders).toEqual([]);
  });

  it('spreads a spec into icon + iconFamily without losing the family', () => {
    const spec = AppIcons.map.route;
    expect(spec.family).not.toBe('ion');
    expect(iconProps(spec)).toEqual({ icon: spec.name, iconFamily: spec.family });
  });
});