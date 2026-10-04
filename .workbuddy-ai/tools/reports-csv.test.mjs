/**
 * CSV assertions for the oversight console's export.
 *
 * The export is read by people outside the system — an org head pastes it into a
 * spreadsheet and mails it up — so the two failure modes that matter are silent:
 * Persian text arriving as mojibake, and a column whose quotes break every row
 * after it. Both are asserted here rather than eyeballed.
 */

import { reportsToCsv } from "./reports-csv.js";

const rows = [
  {
    _id: "a1",
    report_id: "REP-1",
    source: "accident",
    group_title: "تصادف",
    sort_at: "2026-10-01T10:00:00.000Z",
    sync_status: "synced",
    review_status: "submitted",
    officer: { first_name: "علی", last_name: "رضایی", personnel_code: "1234" },
    submitted_from: { app_version: "1.4.2", platform: "ios" },
    description: "خط، و نقل قول \"دو\"",
  },
  {
    _id: "b2",
    report_id: "INC-2",
    source: "incident_report",
    group_title: "خرابی آسفالت",
    sort_at: "2026-10-02T10:00:00.000Z",
    sync_status: "queued",
    review_status: "submitted",
    officer: { first_name: "سارا", last_name: "محمدی" },
    description: "",
  },
];

let pass = 0;
const failures = [];

function check(label, condition, detail = "") {
  if (condition) {
    pass++;
  } else {
    failures.push(detail ? `${label} -> ${detail}` : label);
  }
}

const eq = (label, actual, expected) =>
  check(
    label,
    JSON.stringify(actual) === JSON.stringify(expected),
    `expected ${JSON.stringify(expected)}, actual ${JSON.stringify(actual)}`,
  );

const csv = reportsToCsv(rows);
const body = csv.replace(/^﻿/, "");
const lines = body.split("\n");

// ------------------------------------------------------------------ file format
// Without the BOM Excel reads Persian as mojibake, which makes the export look
// broken on exactly the machines most likely to receive it.
check("starts with a UTF-8 BOM so Excel reads Persian", csv.charCodeAt(0) === 0xfeff);
check("has a header row", lines[0].includes("report_id"), lines[0]);
eq(
  "header names every column in order",
  lines[0].split(","),
  [
    "report_id",
    "source",
    "form",
    "date",
    "sync_status",
    "review_status",
    "review_reason",
    "officer",
    "personnel_code",
    "patrol_unit",
    "road",
    "kilometer",
    "description",
    "app_version",
    "platform",
  ],
);
check("has one line per row", body.trim().split("\n").length === 3, String(lines.length));
check("ends with a newline", csv.endsWith("\n"));

// ------------------------------------------------------------------- cell rules
check("keeps Persian text intact", body.includes("رضایی") && body.includes("آسفالت"));
check("quotes a field containing a comma", body.includes('"خط، و نقل قول'), lines[1]);
check("escapes an embedded quote by doubling it", body.includes('""دو""'), lines[1]);
check("renders a missing app version as an em dash", body.includes("—"));
check("renders an absent platform as an em dash", body.includes("—"));
check("renders an empty description as an em dash, not a blank cell", lines[2].includes("—"));
check("leaves no trailing separator on a row", !lines[2].endsWith(","));
check("joins the officer's names", lines[1].includes("علی رضایی"), lines[1]);

// A newline inside a value must not split the row into two, so it has to be
// quoted — otherwise every column after it on that row is read as a new record.
const multiline = reportsToCsv([
  { _id: "c3", source: "incident_report", description: "خط اول\nخط دوم" },
]);
check(
  "quotes a value containing a newline",
  multiline.replace(/^﻿/, "").includes('"خط اول\nخط دوم"'),
  multiline,
);

// -------------------------------------------------------------------- empty set
const empty = reportsToCsv([]);
check("an empty result is still a BOM plus a header", empty === "﻿report_id,source,form,date,sync_status,review_status,review_reason,officer,personnel_code,patrol_unit,road,kilometer,description,app_version,platform\n");

// ----------------------------------------------------------------------- labels
const labelled = reportsToCsv(rows, { synced: "همگام‌شده", queued: "در صف" });
check("translates a value through the labels map", labelled.includes("همگام‌شده"));
check("leaves an unlabelled value alone", labelled.includes("submitted"), labelled);

// ------------------------------------------------------------------------ report
console.log(`\n${pass} assertions passed`);
if (failures.length) {
  console.log(`${failures.length} FAILED:\n`);
  for (const failure of failures) console.log(`  x ${failure}`);
  console.log("\n--- csv ---\n" + body);
  process.exit(1);
}
console.log("all reports-csv assertions pass\n");