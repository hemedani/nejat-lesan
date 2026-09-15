/**
 * Email normalization (lowercase everywhere).
 *
 * Run: deno test -A test/normalize-email-test.ts
 */

import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { normalizeEmail } from "../utils/normalizeEmail.ts";

Deno.test("normalizeEmail lowercases and trims", () => {
	assertEquals(normalizeEmail("  Saleh@Nejat.AI  "), "saleh@nejat.ai");
});

Deno.test("normalizeEmail leaves already-normalized addresses unchanged", () => {
	assertEquals(normalizeEmail("ghost@nejat.ai"), "ghost@nejat.ai");
});
