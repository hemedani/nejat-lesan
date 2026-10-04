"use client";

import type { ComponentType } from "react";

import { DEFAULT_FORM_ICON, type FormIconName } from "@forms";

import { FORM_ICON_MAP } from "./form-icon-map";

/**
 * Renders a form icon by name.
 *
 * The vocabulary lives in `@forms` (`shared/form-engine/src/icons.ts`) because the
 * backend, this builder and the patrol app all have to agree on which icons exist.
 * What cannot be shared is the *renderer*: the Deno backend has no React, and the
 * phone needs `@phosphor-icons/react-native`. So each app maps the same name to its
 * own component, and both derive the export name from the shared
 * `phosphorComponentName`, so the two cannot drift on capitalisation.
 *
 * An unrecognised name renders nothing rather than throwing, so a definition
 * written before a rename degrades to a blank glyph instead of breaking the page.
 */
export function FormIcon({
	name,
	size = 18,
	className = "",
	weight = "regular",
}: {
	name?: string | null;
	size?: number;
	className?: string;
	weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
}) {
	const Glyph = resolveFormIcon(name);
	if (!Glyph) return null;
	return (
		<Glyph
			size={size}
			className={className}
			weight={weight}
			aria-hidden="true"
		/>
	);
}

export const isFormIconAvailable = (name?: string | null): boolean =>
	Boolean(resolveFormIcon(name));

const resolveFormIcon = (
	name?: string | null,
): ComponentType<Record<string, unknown>> | undefined => {
	if (!name) return undefined;
	const component = FORM_ICON_MAP[name as FormIconName];
	return component as ComponentType<Record<string, unknown>> | undefined;
};

export { DEFAULT_FORM_ICON };
