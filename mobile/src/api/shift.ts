import type { ActiveShift, Session } from '@/domain/types';

import type { ActiveShiftRequest } from './backend-types';
import { callTypedAct } from './client';

export function getActiveShift(
  session: Session,
  details: ActiveShiftRequest['details'],
): Promise<ActiveShift> {
  return callTypedAct(
    {
      service: 'main',
      model: 'shift',
      act: 'getActiveShift',
      details,
    },
    { token: session.token },
  );
}