import { normalizeIncidentType } from '@/domain/incident-type';
import type { IncidentType } from '@/domain/types';
import { DEFAULT_ACCIDENT_FORM_ID } from './default-accident-form';
import { hasFormAnswers, isFormDraftData } from './form-submission';

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

/** The two screens the built-in standard flow is made of. */
export type StandardRoute = '/incident/details' | '/incident/simple';

/** The built-in standard flow for an incident type. */
export function standardRouteFor(type: IncidentType): StandardRoute {
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

/**
 * Where a saved draft reopens.
 *
 * Discriminated on `pathname` so the dynamic form cannot be opened without the
 * definition it must reload: that screen has nothing to render from an absent id,
 * and the compiler enforces it here rather than the screen failing at runtime.
 */
export type DraftResumeTarget =
	| { pathname: '/incident/form'; definitionId: string }
	| { pathname: '/incident/process' | '/incident/details' | '/incident/simple' };

/**
 * Which editor reopens a **saved** draft.
 *
 * The draft's own provenance decides, not the officer's current choices: the answers
 * on the device were shaped by the questions that produced them, so reopening an
 * org-process draft in the built-in wizard would show a different form than the one
 * the officer filled and silently drop what they typed on the next save.
 *
 * Precedence mirrors `resolveIncidentRoute`, highest first:
 * 1. a form-filed draft that names its form (`form_definition_id`) → the dynamic
 *    form, carrying the definition id it was captured under;
 * 2. a form-filed draft that does **not** — the bundled accident default has no
 *    backend document and writes no id — → the dynamic form with the well-known
 *    bundled id, which it loads from the bundle and so needs no network;
 * 3. an org-process draft (`process_version`) → the process wizard;
 * 4. the built-in standard flow for the type — the fallback for a legacy draft,
 *    which carries no provenance at all.
 *
 * Unlike `resolveIncidentRoute` there is deliberately **no offline fallback**. A
 * draft is usually reopened precisely because it is unfinished, and the dynamic form
 * needs the network to fetch its questions — but sending it to the standard wizard
 * instead would show it the wrong questions and overwrite the stored answers with a
 * different shape. Waiting for a connection costs the officer a retry; guessing
 * costs them the report.
 */
export function resumeRouteFor(
	draft: { incident_type?: string; data?: Record<string, unknown> } | null | undefined,
): DraftResumeTarget {
	const data = draft?.data ?? {};

	if (isFormDraftData(data)) {
		return {
			pathname: '/incident/form',
			definitionId: data['form_definition_id'] as string,
		};
	}
	if (hasFormAnswers(data)) {
		return { pathname: '/incident/form', definitionId: DEFAULT_ACCIDENT_FORM_ID };
	}
	if (typeof data['process_version'] === 'number') {
		return { pathname: '/incident/process' };
	}
	return { pathname: standardRouteFor(normalizeIncidentType(draft?.incident_type)) };
}
