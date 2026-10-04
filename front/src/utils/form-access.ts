import { getRoleNames, isSuperViewer, type PanelViewer } from "@/utils/panels";
import type { RoleName, UserLevel } from "@/types/auth";

/**
 * Who may author an incident form — **role only**.
 *
 * Extracted from `components/org/forms/FormAuthorGuard.tsx` so the assertion
 * harness can test it. The guard is a React component and cannot be imported
 * into Node, which is exactly why this rule had no test.
 *
 * Deliberately questions *who*, not *whether the feature is licensed*. Those are
 * two different failures and they deserve two different responses:
 *
 * - **Wrong person** (`Patrol`, `Enterprise`, `Editor`) → the guard redirects them
 *   to their own panel. There is nothing to explain: they will never author.
 * - **Right person, module off** → `/forms/layout.tsx` renders
 *   `<ModuleGate module="forms" scoped>` and they see why, plus where to ask for
 *   it. A silent bounce from a feature they are entitled to use is a worse answer
 *   than an explanation.
 *
 * Folding licensing into this predicate — as an earlier draft did — made
 * `ModuleGate` unreachable, so the explanation could never appear. The nav entry
 * carries `requiredModule: "forms"` for the same reason: hide it from the menu,
 * explain it at the door.
 */
const AUTHOR_LEVELS: UserLevel[] = ["Ghost", "Manager", "OrgHead", "UnitHead"];
const AUTHOR_ROLES: RoleName[] = ["OrgHead", "UnitHead"];

export function canAuthorForms(viewer: PanelViewer): boolean {
  if (isSuperViewer(viewer)) return true;
  if (AUTHOR_LEVELS.includes(viewer.level)) return true;
  const roles = getRoleNames(viewer.roles);
  return AUTHOR_ROLES.some((name) => roles.includes(name));
}