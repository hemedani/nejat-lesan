import type { ComponentType } from 'react';

import { DEFAULT_FORM_ICON, type FormIconName } from '@forms';

import { FORM_ICON_MAP } from '@/constants/form-icon-map';

/**
 * Renders a form icon by name.
 *
 * The vocabulary lives in `@forms` (`shared/form-engine/src/icons.ts`) because the
 * backend, the web builder and this app all have to agree on which icons exist.
 * Only the *renderer* differs per runtime — the Deno backend has no React, the web
 * app uses `@phosphor-icons/react`, and here it is `phosphor-react-native` — so both
 * apps map the same name to their own component.
 *
 * An unrecognised name renders nothing rather than throwing, so a definition saved
 * before a rename degrades to a blank glyph instead of breaking the form.
 */
export function FormIcon({
	name,
	size = 18,
	color,
	weight = 'regular',
}: {
	name?: string | null;
	size?: number;
	color?: string;
	weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}) {
	const Glyph = resolveFormIcon(name);
	if (!Glyph) return null;
	const Icon = Glyph as ComponentType<Record<string, unknown>>;
	return <Icon size={size} color={color} weight={weight} />;
}

export const isFormIconAvailable = (name?: string | null): boolean =>
	Boolean(resolveFormIcon(name));

const resolveFormIcon = (
	name?: string | null,
): ComponentType<Record<string, unknown>> | undefined => {
	if (!name) return undefined;
	return FORM_ICON_MAP[name as FormIconName] as
		| ComponentType<Record<string, unknown>>
		| undefined;
};

export { DEFAULT_FORM_ICON };
