import type { BackendActRequest } from './backend-types';
import type { ApiRequestOptions } from './client';
import { callTypedAct } from './client';
import type { IncidentType, Session } from '@/domain/types';
import type { AccidentAddSet } from '@/domain/accident-mapper';

export type AccidentAddRequest = BackendActRequest<'main', 'accident', 'add'>;

export type AccidentAck = {
  _id: string;
  report_id?: string;
  serial?: number;
};

const ACK_PROJECTION = {
  _id: 1,
  report_id: 1,
  serial: 1,
} as const;

export function submitAccidentReport(
  session: Session,
  set: AccidentAddSet,
  options: ApiRequestOptions = {},
): Promise<AccidentAck> {
  return callTypedAct<'main', 'accident', 'add', AccidentAck>(
    {
      service: 'main',
      model: 'accident',
      act: 'add',
      details: {
        set: set as unknown as AccidentAddRequest['details']['set'],
        get: ACK_PROJECTION,
      },
    },
    { token: session.token, ...options },
  );
}

export function updateAccidentReportByUuid(
  session: Session,
  clientReportUuid: string,
  set: AccidentAddSet,
  options: ApiRequestOptions = {},
): Promise<AccidentAck> {
  return callTypedAct<'main', 'accident', 'update', AccidentAck>(
    {
      service: 'main',
      model: 'accident',
      act: 'update',
      details: {
        set: { ...set, client_report_uuid: clientReportUuid } as unknown as AccidentAddRequest['details']['set'],
        get: ACK_PROJECTION,
      },
    },
    { token: session.token, ...options },
  );
}

export type ResubmitAck = {
  _id: string;
  review_status?: MyReport['review_status'];
  rejection_reason?: string | null;
};

const RESUBMIT_PROJECTION = {
  _id: 1,
  review_status: 1,
  rejection_reason: 1,
} as const;

/**
 * Backend contract: Patrol, own report, must already be `synced` + `returned`.
 * Sets `review_status = submitted` and clears `review_reason`.
 */
export function resubmitReturnedReport(
  session: Session,
  reportId: string,
  options: ApiRequestOptions = {},
): Promise<ResubmitAck> {
  return callTypedAct<'main', 'accident', 'resubmitReport', ResubmitAck>(
    {
      service: 'main',
      model: 'accident',
      act: 'resubmitReport',
      details: {
        set: { reportId },
        get: RESUBMIT_PROJECTION,
      },
    },
    { token: session.token, ...options },
  );
}

export type MyReport = {
  _id: string;
  report_id?: string;
  client_report_uuid?: string;
  incident_type?: IncidentType;
  date_of_accident?: string;
  reported_at?: string;
  sync_status?: 'draft' | 'queued' | 'syncing' | 'synced' | 'rejected';
  review_status?: 'submitted' | 'under_review' | 'returned' | 'approved' | 'completed';
  rejection_reason?: string;
};

const MY_REPORTS_PROJECTION = {
  _id: 1,
  report_id: 1,
  client_report_uuid: 1,
  incident_type: 1,
  date_of_accident: 1,
  reported_at: 1,
  sync_status: 1,
  review_status: 1,
  rejection_reason: 1,
} as const;

export type MyReportsQuery = {
  page?: number;
  limit?: number;
  incidentType?: IncidentType;
};

export function fetchMyReports(
  session: Session,
  pagination: MyReportsQuery = {},
  options: ApiRequestOptions = {},
): Promise<MyReport[]> {
  return callTypedAct<'main', 'accident', 'getMyReports', MyReport[]>(
    {
      service: 'main',
      model: 'accident',
      act: 'getMyReports',
      details: {
        set: {
          ...(pagination.page != null ? { page: pagination.page } : {}),
          ...(pagination.limit != null ? { limit: pagination.limit } : {}),
          ...(pagination.incidentType != null
            ? { incidentType: pagination.incidentType }
            : {}),
        },
        get: MY_REPORTS_PROJECTION,
      },
    },
    { token: session.token, ...options },
  );
}
