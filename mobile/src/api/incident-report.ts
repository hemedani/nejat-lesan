import type { BackendActRequest } from './backend-types';
import type { ApiRequestOptions } from './client';
import { callTypedAct } from './client';
import type { Session } from '@/domain/types';

/**
 * Non-accident reports: road damage, obstructions and other events.
 *
 * A separate module from `api/accident.ts` because these are a different model
 * with a different act surface. Keeping them apart is what makes it obvious at the
 * call site that a report cannot be filed as an accident.
 */

export type IncidentReportAck = {
  _id: string;
  report_id?: string;
  serial?: number;
};

type AddRequest = BackendActRequest<'main', 'incident_report', 'add'>;
type UpdateRequest = BackendActRequest<'main', 'incident_report', 'update'>;

export function submitIncidentReport(
  session: Session,
  set: Record<string, unknown>,
  options: ApiRequestOptions = {},
): Promise<IncidentReportAck> {
  return callTypedAct<'main', 'incident_report', 'add', IncidentReportAck>(
    {
      service: 'main',
      model: 'incident_report',
      act: 'add',
      details: { set: set as never, get: { _id: 1, report_id: 1, serial: 1 } },
    } as unknown as AddRequest,
    { token: session.token, ...options },
  );
}

/**
 * Correct a filed report, addressed by the client uuid so a retried correction
 * cannot create a second document.
 */
export function updateIncidentReportByUuid(
  session: Session,
  clientReportUuid: string,
  set: Record<string, unknown>,
  options: ApiRequestOptions = {},
): Promise<IncidentReportAck> {
  return callTypedAct<'main', 'incident_report', 'update', IncidentReportAck>(
    {
      service: 'main',
      model: 'incident_report',
      act: 'update',
      details: {
        set: { client_report_uuid: clientReportUuid, ...set } as never,
        get: { _id: 1, report_id: 1, serial: 1 },
      },
    } as unknown as UpdateRequest,
    { token: session.token, ...options },
  );
}

/** The officer re-submits a report the control centre returned. */
export function resubmitReturnedIncidentReport(
  session: Session,
  reportId: string,
  options: ApiRequestOptions = {},
): Promise<{ _id: string }> {
  return callTypedAct<'main', 'incident_report', 'resubmitReport', { _id: string }>(
    {
      service: 'main',
      model: 'incident_report',
      act: 'resubmitReport',
      details: {
        set: { reportId },
        get: { _id: 1, review_status: 1 },
      },
    } as unknown as BackendActRequest<'main', 'incident_report', 'resubmitReport'>,
    { token: session.token, ...options },
  );
}
