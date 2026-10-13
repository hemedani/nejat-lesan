import assert from "node:assert/strict";

const { attachmentIndex, resolveFileAnswer } = await import("./answer-files.js");

const IMAGE = { _id: "f1", name: "shot.jpg", path: "images/shot.jpg", type: "image/jpeg" };
const VIDEO = { _id: "f2", name: "clip.mp4", path: "videos/clip.mp4", type: "video/mp4" };
const PDF = { _id: "f3", name: "doc.pdf", path: "docs/doc.pdf", type: "application/pdf" };

const index = attachmentIndex([IMAGE, VIDEO, PDF]);

const checks = [];
function check(name, fn) {
  try {
    fn();
    checks.push(`  ok   ${name}`);
  } catch (error) {
    const detail = error.message.split("\n").slice(0, 8).join("\n       ");
    checks.push(`  FAIL ${name}\n       ${detail}`);
    process.exitCode = 1;
  }
}

// --- the index -------------------------------------------------------------

check("indexes attachments by _id", () => {
  assert.equal(index.get("f1"), IMAGE);
  assert.equal(index.size, 3);
});

check("an attachment with no _id is skipped rather than stored under undefined", () => {
  assert.equal(attachmentIndex([{ name: "orphan.jpg" }, IMAGE]).size, 1);
});

check("a report with no attachments yields an empty index, not a throw", () => {
  assert.equal(attachmentIndex(undefined).size, 0);
  assert.equal(attachmentIndex([]).size, 0);
});

// --- resolving a leaf ------------------------------------------------------
//
// The rule under test: a leaf is a file reference when its value resolves
// against `attachments`. Not when it looks like a filename.

check("a single id resolves to its file", () => {
  assert.deepEqual(resolveFileAnswer("f1", index), [IMAGE]);
});

check("an array of ids resolves in order", () => {
  assert.deepEqual(resolveFileAnswer(["f3", "f1"], index), [PDF, IMAGE]);
});

check("an id with no attachment is not a file answer", () => {
  assert.equal(resolveFileAnswer("nope", index), undefined);
});

check("an array is only a file answer when EVERY id resolves", () => {
  // The mixed case is the important one: rendering half of a set as files and
  // the other half as text is worse than rendering the whole leaf as text.
  assert.equal(resolveFileAnswer(["f1", "nope"], index), undefined);
});

check("non-string leaves are never file answers", () => {
  for (const value of [true, false, 42, null, undefined, { _id: "f1" }]) {
    assert.equal(resolveFileAnswer(value, index), undefined, `value: ${JSON.stringify(value)}`);
  }
});

check("an empty array is not a file answer", () => {
  assert.equal(resolveFileAnswer([], index), undefined);
});

check("a select answer never resolves — option values are not attachment ids", () => {
  // This is the false positive the rule has to exclude. A literal select stores
  // `opt_a`-style values; resolving against attachments is what keeps it out.
  assert.equal(resolveFileAnswer("بله", index), undefined);
  assert.equal(resolveFileAnswer(["opt_a", "opt_b"], index), undefined);
});

check("nothing resolves against an empty index", () => {
  const empty = attachmentIndex([]);
  assert.equal(resolveFileAnswer("f1", empty), undefined);
});

console.log(checks.join("\n"));
console.log(process.exitCode ? "\nFAILED" : "\nall checks passed");