import { describe, expect, it } from 'vitest';

import {
	resolveIncidentRoute,
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
