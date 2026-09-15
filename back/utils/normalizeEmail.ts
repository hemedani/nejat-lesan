/**
 * Canonical email form used by every user write and lookup.
 *
 * Emails are stored and matched in lowercase so that logins and duplicate
 * checks are case-insensitive end to end. Always run raw input through this
 * before persisting an email or using it as a query key.
 */
export const normalizeEmail = (email: string): string =>
	email.trim().toLowerCase();
