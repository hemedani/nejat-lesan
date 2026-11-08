/**
 * Unlinking the bytes behind a `file` document.
 *
 * The row is the pointer, the upload tree is the thing it points at, and nothing
 * in Lesan deletes the second when it deletes the first. These tests pin the two
 * decisions that make `removeStoredBytes` safe to call from a delete act: where a
 * document says its bytes are (recorded `path`, else the pre-`path` fallback), and
 * that a stored path can never reach outside the upload tree.
 *
 * Run: deno test -A test/stored-files-test.ts
 */

import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.208.0/testing/asserts.ts";
import {
	removeStoredBytes,
	storedPathOf,
	UPLOAD_ROOT,
} from "../utils/storedFiles.ts";

const RUN = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

const probeDir = `${UPLOAD_ROOT}/__stored_files_test_${RUN}`;

/** Write a throwaway file into the upload tree, the way an upload act would. */
const writeProbe = async (name: string) => {
	await Deno.mkdir(probeDir, { recursive: true });
	const absolute = `${probeDir}/${name}`;
	await Deno.writeFile(absolute, new Uint8Array([1, 2, 3]));
	return {
		absolute,
		relative: absolute.replace(`${UPLOAD_ROOT}/`, ""),
	};
};

const exists = async (path: string) => {
	try {
		await Deno.stat(path);
		return true;
	} catch {
		return false;
	}
};

Deno.test("storedPathOf prefers the recorded path", () => {
	assertEquals(
		storedPathOf({ name: "abc-photo.png", path: "images/abc-photo.png" }),
		"images/abc-photo.png",
	);
});

Deno.test("storedPathOf falls back to the accident tree for rows without one", () => {
	// Documents written before `path` existed are all accident uploads, and
	// `accident/<name>` is where `uploadAccidentImages` has always put them.
	assertEquals(
		storedPathOf({ name: "abc-photo.png" }),
		"accidents/abc-photo.png",
	);
});

Deno.test("storedPathOf refuses a document that names nothing", () => {
	assertEquals(storedPathOf({}), null);
	assertEquals(storedPathOf({ name: "   ", path: "" }), null);
});

Deno.test("removeStoredBytes unlinks a recorded path", async () => {
	const probe = await writeProbe("recorded.png");

	assertEquals(await removeStoredBytes([{ path: probe.relative }]), 1);
	assertEquals(
		await exists(probe.absolute),
		false,
		"the bytes should be gone",
	);
});

Deno.test("removeStoredBytes unlinks a legacy row by its fallback path", async () => {
	const probe = await writeProbe("legacy.png");
	// No `path`: the fallback has to be `accidents/<name>` for this to be found,
	// so the probe is addressed the same way the upload act names it.
	await Deno.mkdir(`${UPLOAD_ROOT}/accidents`, { recursive: true });
	const legacy = `${UPLOAD_ROOT}/accidents/${RUN}-legacy.png`;
	await Deno.writeFile(legacy, new Uint8Array([4, 5, 6]));

	assertEquals(
		await removeStoredBytes([{ name: `${RUN}-legacy.png` }]),
		1,
	);
	assertEquals(
		await exists(legacy),
		false,
		"the fallback path should be used",
	);

	// Keep the fixture tree tidy for the checks that follow.
	await Deno.remove(probe.absolute);
});

Deno.test("removeStoredBytes treats an already-missing file as done", async () => {
	const probe = await writeProbe("vanishes.png");
	await Deno.remove(probe.absolute);

	// Not a failure: a sweep or an earlier delete may have taken it, and the row
	// removal this accompanies is the authoritative half.
	assertEquals(await removeStoredBytes([{ path: probe.relative }]), 0);
});

Deno.test("removeStoredBytes will not unlink outside the upload tree", async () => {
	// `..` from the upload root lands in the working directory, which is where a
	// traversal would aim. The file must survive the attempt.
	const outside = `__stored_files_outside_${RUN}.png`;
	await Deno.writeFile(outside, new Uint8Array([7, 8, 9]));

	assertEquals(
		await removeStoredBytes([{ path: `../${outside}` }]),
		0,
	);
	assertEquals(
		await exists(outside),
		true,
		"a stored path must not reach outside the upload tree",
	);
	assertEquals(await removeStoredBytes([{ path: `/etc/hosts` }]), 0);

	await Deno.remove(outside);
});

Deno.test("removeStoredBytes reports what it removed", async () => {
	const first = await writeProbe("one.png");
	const second = await writeProbe("two.png");
	const missing = await writeProbe("three.png");
	await Deno.remove(missing.absolute);

	assertEquals(
		await removeStoredBytes([
			{ path: first.relative },
			{ path: second.relative },
			{ path: missing.relative },
			{},
		]),
		2,
		"only files that were actually there count",
	);

	await Deno.remove(probeDir, { recursive: true });
	assert(!(await exists(probeDir)), "the fixture tree should be cleaned up");
});
