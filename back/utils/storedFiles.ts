import { resolve, sep } from "node:path";

/**
 * The bytes behind a `file` document.
 *
 * A `file` row is not the upload, it is a pointer to one — and nothing in the
 * database deletes the other half. `accident.remove` and
 * `incident_report.remove` delete the `file` documents of the report they
 * remove (a `file` holds a `mainRelation` to both, so Lesan's `hardCascade`
 * takes them as dependents), which left the bytes on disk with no row left to
 * name them: unreachable through the API, invisible to `file.removeOrphans`
 * (whose whole question is which *rows* to keep), and only visible to whoever
 * runs `du` on the server.
 *
 * So every act that deletes a `file` row has to unlink the bytes too, and this
 * module is the one place that knows where they are.
 */

/** Root of the upload tree, as `mod.ts` serves it at `/uploads`. */
export const UPLOAD_ROOT = "./uploads";

/** What a `file` document has to tell us for its bytes to be found. */
export type StoredFileRef = { name?: unknown; path?: unknown };

/**
 * Where a document's bytes live, relative to `UPLOAD_ROOT`.
 *
 * `path` is recorded by both upload acts and is authoritative when present.
 * Documents written before that field existed are all accident uploads —
 * `uploadFile` has always recorded it — so the fallback is `accidents/<name>`,
 * which is what the orphan sweep assumed before this was factored out.
 *
 * `null` when the document names nothing usable. The caller reports that rather
 * than unlinking a guess.
 */
export const storedPathOf = (doc: StoredFileRef): string | null => {
	const recorded = typeof doc.path === "string" ? doc.path.trim() : "";
	if (recorded.length > 0) return recorded;
	const name = typeof doc.name === "string" ? doc.name.trim() : "";
	return name.length > 0 ? `accidents/${name}` : null;
};

/**
 * Absolute path for `relative`, or `null` when it points outside the tree.
 *
 * `path` is written by this server, so this should never fire — but a delete
 * that trusts a stored string is one bad write away from unlinking something
 * else on the host, and the check costs two lines.
 */
const resolveInsideUploads = (relative: string): string | null => {
	const root = resolve(UPLOAD_ROOT);
	const absolute = resolve(root, relative);
	return absolute.startsWith(root + sep) ? absolute : null;
};

/**
 * Unlink the bytes behind `docs`, and report how many files actually went.
 *
 * Best-effort on purpose, the same way the orphan sweep is: removing the row is
 * the authoritative half of a delete and must not be undone by a file that is
 * already missing. A `NotFound` is therefore silent — the bytes were gone
 * already, e.g. a sweep raced this delete — while anything else is logged for
 * an operator, because that is a leak with a name attached.
 */
export const removeStoredBytes = async (
	docs: readonly StoredFileRef[],
): Promise<number> => {
	let removed = 0;

	for (const doc of docs) {
		const relative = storedPathOf(doc);
		if (!relative) {
			console.warn(
				"file row without a name or path; nothing to unlink:",
				doc,
			);
			continue;
		}

		const absolute = resolveInsideUploads(relative);
		if (!absolute) {
			console.warn(
				`refusing to unlink a path outside ${UPLOAD_ROOT}: ${relative}`,
			);
			continue;
		}

		try {
			await Deno.remove(absolute);
			removed++;
		} catch (error) {
			if (!(error instanceof Deno.errors.NotFound)) {
				console.warn(`could not unlink ${absolute}:`, error);
			}
		}
	}

	return removed;
};
