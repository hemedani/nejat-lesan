import { describe, expect, it } from 'vitest';

import type { Session } from '@/domain/types';
import {
  hasModule,
  isIncidentPatrolEnabled,
  moduleDisabledMessage,
  MODULE_DISABLED_INSTALL_MESSAGE,
  MODULE_DISABLED_ORG_MESSAGE,
} from './modules';

function session(overrides: Partial<Session> = {}): Session {
  return {
    device_id: 'd1',
    token: 'tok',
    user: { _id: 'u1', first_name: 'علی', last_name: 'رضایی', level: 'Patrol' },
    ...overrides,
  };
}

describe('module gating', () => {
  it('treats absent/stale module arrays as enabled', () => {
    expect(isIncidentPatrolEnabled(session())).toBe(true);
    expect(isIncidentPatrolEnabled(session({ modules: undefined, orgModules: null }))).toBe(true);
    expect(isIncidentPatrolEnabled(null)).toBe(true);
  });

  it('detects a positively-off installation module', () => {
    const s = session({ modules: ['charts'] });
    expect(hasModule(s, 'incident_patrol')).toBe(false);
    expect(isIncidentPatrolEnabled(s)).toBe(false);
    expect(moduleDisabledMessage(s)).toBe(MODULE_DISABLED_INSTALL_MESSAGE);
  });

  it('detects a positively-off org module for a single-org caller', () => {
    const s = session({ modules: ['incident_patrol'], orgModules: ['charts'] });
    expect(isIncidentPatrolEnabled(s)).toBe(false);
    expect(moduleDisabledMessage(s)).toBe(MODULE_DISABLED_ORG_MESSAGE);
  });

  it('exempts Ghost from module gates', () => {
    const s = session({ user: { _id: 'g1', first_name: 'گ', last_name: 'ها', level: 'Ghost' } });
    expect(isIncidentPatrolEnabled(s)).toBe(true);
    expect(moduleDisabledMessage(s)).toBeNull();
  });

  it('returns no notice when the module is enabled', () => {
    expect(moduleDisabledMessage(session({ modules: ['incident_patrol'], orgModules: ['incident_patrol'] }))).toBeNull();
  });
});
