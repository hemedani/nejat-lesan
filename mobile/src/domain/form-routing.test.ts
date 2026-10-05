import { describe, expect, it } from 'vitest';

import { DEFAULT_ACCIDENT_FORM_ID } from './default-accident-form';
import {
	resolveIncidentRoute,
	resumeRouteFor,
	standardRouteFor,
	targetModelFor,
} from './form-routing';

const base = {
	incidentType: 'accident' as const,
	online: true,
	hasChosenForm: false,
	hasRenderableProcess: false,
};

describe('resolveIncidentRoute', () => {
	it('sends the officer to the form they picked', () => {
		expect(resolveIncidentRoute({ ...base, hasChosenForm: true })).toBe('/incident/form');
		expect(
			resolveIncidentRoute({
				...base,
				incidentType: 'road_breakdown',
				hasChosenForm: true,
			}),
		).toBe('/incident/form');
	});

	it('uses the org process wizard for accidents only', () => {
		expect(
			resolveIncidentRoute({ ...base, hasRenderableProcess: true }),
		).toBe('/incident/process');

		// The wizard no longer authors non-accident forms, so offering it for one
		// would route an officer into a form whose answers `incident_report` rejects.
		expect(
			resolveIncidentRoute({
				...base,
				incidentType: 'road_obstacle',
				hasRenderableProcess: true,
			}),
		).toBe('/incident/simple');
	});

	it('falls back to the standard flow when an org has no form of its own', () => {
		expect(resolveIncidentRoute(base)).toBe('/incident/details');
		expect(
			resolveIncidentRoute({ ...base, incidentType: 'road_breakdown' }),
		).toBe('/incident/simple');
	});

	it('never reaches for the process wizard while offline', () => {
		expect(
			resolveIncidentRoute({ ...base, online: false, hasRenderableProcess: true }),
		).toBe('/incident/details');
	});

	it('prefers a chosen form over the process wizard', () => {
		expect(
			resolveIncidentRoute({
				...base,
				hasChosenForm: true,
				hasRenderableProcess: true,
			}),
		).toBe('/incident/form');
	});
});

describe('standardRouteFor', () => {
	it('routes تصادف to the seven-phase wizard and the rest to the light form', () => {
		expect(standardRouteFor('accident')).toBe('/incident/details');
		expect(standardRouteFor('road_breakdown')).toBe('/incident/simple');
		expect(standardRouteFor('road_obstacle')).toBe('/incident/simple');
		expect(standardRouteFor('other')).toBe('/incident/simple');
	});
});

describe('targetModelFor', () => {
	it('sends accidents and everything else to different collections', () => {
		// This is the split that keeps accident statistics exact: a non-accident
		// report can never land in `accident`.
		expect(targetModelFor('accident')).toBe('accident');
		expect(targetModelFor('road_breakdown')).toBe('incident_report');
		expect(targetModelFor('road_obstacle')).toBe('incident_report');
		expect(targetModelFor('other')).toBe('incident_report');
	});
});

describe('resumeRouteFor', () => {
	it('reopens a form-filed draft in the dynamic form, with its definition', () => {
		// Without the definition id the form screen has nothing to render, and the
		// stored answers cannot be mapped back to the questions that produced them.
		expect(
			resumeRouteFor({
				data: { form_answers: {}, form_definition_id: 'fd-42' },
				incident_type: 'accident',
			}),
		).toEqual({ pathname: '/incident/form', definitionId: 'fd-42' });
	});

	it('reopens a bundled-default form draft, which names no form', () => {
		// The bundled accident default has no backend document, so `form.tsx`
		// deliberately writes no `form_definition_id` for it. The answer tree is the
		// marker that survives — without this case such a draft resumed in the legacy
		// wizard, which reads a different shape and would have shown it empty.
		expect(
			resumeRouteFor({
				data: { form_answers: { damage: 'yes' }, form_page_index: 2 },
				incident_type: 'accident',
			}),
		).toEqual({ pathname: '/incident/form', definitionId: DEFAULT_ACCIDENT_FORM_ID });
	});

	it('reopens an org-process draft in the process wizard', () => {
		expect(
			resumeRouteFor({ data: { process_version: 3 }, incident_type: 'accident' }),
		).toEqual({ pathname: '/incident/process' });
	});

	it('falls back to the type’s standard flow for a draft with no provenance', () => {
		// Legacy rows predate both provenance keys; they still have to reopen.
		expect(resumeRouteFor({ data: {}, incident_type: 'accident' })).toEqual({
			pathname: '/incident/details',
		});
		expect(resumeRouteFor({ data: {}, incident_type: 'road_breakdown' })).toEqual({
			pathname: '/incident/simple',
		});
	});

	it('prefers the form over the process wizard, and the process over the standard flow', () => {
		expect(
			resumeRouteFor({
				data: { form_definition_id: 'fd-1', process_version: 3 },
				incident_type: 'accident',
			}),
		).toEqual({ pathname: '/incident/form', definitionId: 'fd-1' });
		expect(
			resumeRouteFor({ data: { process_version: 3 }, incident_type: 'accident' }),
		).toEqual({ pathname: '/incident/process' });
	});

	it('does not mistake a process draft for a form draft', () => {
		// The process wizard writes `dynamic_answers`, never `form_answers`, so the
		// answer-tree marker cannot steal its drafts.
		expect(
			resumeRouteFor({
				data: { dynamic_answers: [{ key: 'x' }], process_version: 3 },
				incident_type: 'accident',
			}),
		).toEqual({ pathname: '/incident/process' });
	});

	it('does not route to the form for an empty definition id', () => {
		// `isFormDraftData` requires a non-empty id: an empty string would send the
		// form screen off to fetch nothing and render an error instead of a form.
		expect(resumeRouteFor({ data: { form_definition_id: '' }, incident_type: 'accident' }))
			.toEqual({ pathname: '/incident/details' });
	});

	it('survives a missing or absent draft', () => {
		// A draft can vanish between the list render and the tap.
		expect(resumeRouteFor(null)).toEqual({ pathname: '/incident/details' });
		expect(resumeRouteFor(undefined)).toEqual({ pathname: '/incident/details' });
		expect(resumeRouteFor({})).toEqual({ pathname: '/incident/details' });
	});

	it('treats an unknown incident type as an accident', () => {
		expect(resumeRouteFor({ data: {}, incident_type: 'nonsense' })).toEqual({
			pathname: '/incident/details',
		});
	});
});
