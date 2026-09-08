import type { Session } from './types';

export const INCIDENT_PATROL_MODULE = 'incident_patrol';

export const MODULE_DISABLED_INSTALL_MESSAGE = 'این ماژول برای این نصب فعال نیست';
export const MODULE_DISABLED_ORG_MESSAGE = 'این ماژول برای این سازمان فعال نیست';

/**
 * Module licensing (backend v2): gate only on a positively-off `modules`
 * (installation) or `orgModules` (single-org effective set). Ghost is always
 * exempt; absent/stale arrays degrade to "treat as enabled" — the backend
 * stays the hard gate.
 */
export function hasModule(session: Session | null | undefined, moduleKey: string): boolean {
  if (!session) {
    return true;
  }
  if (session.user?.level === 'Ghost') {
    return true;
  }
  const install = session.modules;
  if (Array.isArray(install) && !install.includes(moduleKey)) {
    return false;
  }
  const org = session.orgModules;
  if (org !== null && org !== undefined && Array.isArray(org) && !org.includes(moduleKey)) {
    return false;
  }
  return true;
}

export function isIncidentPatrolEnabled(session: Session | null | undefined): boolean {
  return hasModule(session, INCIDENT_PATROL_MODULE);
}

/** User-facing Persian notice when the module is positively off, else null. */
export function moduleDisabledMessage(session: Session | null | undefined): string | null {
  if (!session || isIncidentPatrolEnabled(session)) {
    return null;
  }
  const install = session.modules;
  if (Array.isArray(install) && !install.includes(INCIDENT_PATROL_MODULE)) {
    return MODULE_DISABLED_INSTALL_MESSAGE;
  }
  return MODULE_DISABLED_ORG_MESSAGE;
}
