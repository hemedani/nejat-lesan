import type { IncidentType } from '@/domain/types';

/**
 * Which screen files an incident report next.
 *
 * Extracted from the incident screen so the precedence is unit-testable rather
 * than buried in a `Pressable` handler: the order is the product decision, and
 * getting it wrong silently sends an officer to a form their organization does not
 * use.
 *
 * Precedence, highest first:
 * 1. the form the officer picked on the entry screen (`/incident/form`) — an
 *    organization's own form, or the bundled accident default;
 * 2. the legacy org process wizard, **accidents only** — it no longer authors
 *    non-accident forms, and its answers would be rejected by `incident_report`;
 * 3. the built-in standard flow — the seven-phase wizard for تصادف and the
 *    lightweight per-type form otherwise. This is also the fallback for a
 *    non-accident report when an organization has authored no form.
 *
 * A form needs the network to fetch, so an offline device takes the standard
 * flow: incident creation must never be blocked.
 */
export type IncidentRoute =
	| '/incident/form'
	| '/incident/process'
	| '/incident/details'
	| '/incident/simple';

/** The built-in standard flow for an incident type. */
export function standardRouteFor(type: IncidentType): IncidentRoute {
	return type === 'accident' ? '/incident/details' : '/incident/simple';
}

/** Whether a report of this type is stored in `accident` or `incident_report`. */
export function targetModelFor(type: IncidentType): 'accident' | 'incident_report' {
	return type === 'accident' ? 'accident' : 'incident_report';
}

export interface RouteInputs {
	/** Incident type the officer picked. */
	incidentType: IncidentType;
	/** Whether the device can reach the backend right now. */
	online: boolean;
	/** The officer chose a form on the entry screen. */
	hasChosenForm: boolean;
	/** An active org process wizard exists and this build can render it. */
	hasRenderableProcess: boolean;
}

/**
 * Resolve the next screen.
 *
 * A chosen form always wins, including for the bundled accident default, because
 * the officer has already seen the questions they are about to answer.
 */
export function resolveIncidentRoute(inputs: RouteInputs): IncidentRoute {
	const { incidentType, online, hasChosenForm, hasRenderableProcess } = inputs;

	if (hasChosenForm) return '/incident/form';
	if (online && hasRenderableProcess && incidentType === 'accident') {
		return '/incident/process';
	}
	return standardRouteFor(incidentType);
}
