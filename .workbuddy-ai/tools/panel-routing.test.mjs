/**
 * Routing assertions for the panel registry.
 *
 * These functions decide where every user lands after login and which panels they
 * can open, so a wrong branch is invisible until someone complains about the wrong
 * screen. They are pure, so they can be tested without a browser.
 */

import {
  canAccessPanel,
  getPanelById,
  getAccessiblePanels,
  getDefaultPanel,
  getScopedRoles,
  isOrgHeadViewer,
  isSuperViewer,
  isUnitHeadViewer,
  makePanelViewer,
  PANEL_DEFINITIONS,
} from "./panels.js";
import { filterPanelSections, formsNavSection, isNavItemActive, ORGHEAD_NAV, PANEL_NAV } from "./panel-nav.js";
import { orgRoutes } from "./org-routes.js";
import { unitHeadRoutes } from "./unit-head-routes.js";
import { employeeRoutes } from "./employee-routes.js";
import { canAuthorForms } from "./form-access.js";
import { MODULE_KEYS, MODULE_LABELS } from "./org.js";
import { getSectionCharts, isChartAccessible } from "./chartNavigation.js";

// `forms` is a fourth module key, not a synonym for `incident_patrol`: the
// form engine is licensed separately so disabling it must not hide the patrol
// console, and disabling patrol must not hide the builder. Omitting it here is
// what let a missing `فرم‌ساز` section pass unnoticed.
const ALL = ["charts", "incident_patrol", "warehouse", "forms"];

const mk = (level, roles = [], mods = ALL) => ({
  level,
  roles,
  hasModule: (k) => mods.includes(k),
  orgHasModule: (k) => mods.includes(k),
});

const orgRole = (name = "Officer") => ({
  roleId: "r1",
  name,
  scopeType: "organization",
  scopeId: "org1",
});
const unitRole = (name = "Officer") => ({
  roleId: "r2",
  name,
  scopeType: "unit",
  scopeId: "unit1",
});

let pass = 0;
const failures = [];

function eq(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    pass++;
  } else {
    failures.push(`${label}\n     expected ${e}\n     actual   ${a}`);
  }
}

// ---------------------------------------------------------------- default panel
eq("Ghost -> /admin", getDefaultPanel(mk("Ghost")), "/admin");
eq("Manager -> /admin", getDefaultPanel(mk("Manager")), "/admin");
eq("Editor, no roles -> /admin", getDefaultPanel(mk("Editor")), "/admin");

eq("OrgHead level -> /orghead", getDefaultPanel(mk("OrgHead")), "/orghead");
eq("UnitHead level -> /unit-head", getDefaultPanel(mk("UnitHead")), "/unit-head");

// A scoped role outranks the coarse level: an Editor placed in a unit is staff.
eq(
  "Editor + org role -> /employee",
  getDefaultPanel(mk("Editor", [orgRole()])),
  "/employee",
);
eq(
  "Enterprise + org role -> /employee",
  getDefaultPanel(mk("Enterprise", [orgRole()])),
  "/employee",
);

// OrgHead/UnitHead roles are more specific than a generic scoped role.
eq(
  "OrgHead role -> /orghead",
  getDefaultPanel(mk("Editor", [orgRole("OrgHead")])),
  "/orghead",
);
eq(
  "UnitHead role -> /unit-head",
  getDefaultPanel(mk("Editor", [unitRole("UnitHead")])),
  "/unit-head",
);

eq(
  "Patrol + module -> /patrol/dashboard",
  getDefaultPanel(mk("Patrol")),
  "/patrol/dashboard",
);
eq(
  "Patrol, no module -> /user",
  getDefaultPanel(mk("Patrol", [], ["charts", "warehouse"])),
  "/user",
);
eq(
  "Enterprise + charts -> /charts/overall",
  getDefaultPanel(mk("Enterprise")),
  "/charts/overall",
);
eq(
  "Enterprise, no charts -> /employee",
  getDefaultPanel(mk("Enterprise", [], ["incident_patrol", "warehouse"])),
  "/employee",
);
eq("null level -> /user", getDefaultPanel(mk(null)), "/user");

// ------------------------------------------------------------------- predicates
eq("isSuperViewer(Ghost)", isSuperViewer(mk("Ghost")), true);
eq("isSuperViewer(Manager)", isSuperViewer(mk("Manager")), true);
eq("isSuperViewer(Editor)", isSuperViewer(mk("Editor")), false);
eq("isOrgHeadViewer(OrgHead level)", isOrgHeadViewer(mk("OrgHead")), true);
eq("isOrgHeadViewer(OrgHead role)", isOrgHeadViewer(mk("Editor", [orgRole("OrgHead")])), true);
eq("isUnitHeadViewer(UnitHead level)", isUnitHeadViewer(mk("UnitHead")), true);
eq("getScopedRoles filters non-scoped", getScopedRoles([orgRole(), { name: "X" }]).length, 1);

// ---------------------------------------------------------------- accessible set
const ids = (v) => getAccessiblePanels(v).map((p) => p.id).sort();

eq(
  "Ghost can open every panel",
  ids(mk("Ghost")),
  ["admin", "employee", "orghead", "patrol", "patrol-manager", "profile", "unit-head"],
);
// OrgHead/UnitHead also get /employee via `extraLevels` — they are often staff
// who consume from the warehouse themselves, so the employee surface is a
// deliberate extra, not a leak.
eq(
  "OrgHead sees orghead + employee + profile",
  ids(mk("OrgHead")),
  ["employee", "orghead", "profile"],
);
eq(
  "UnitHead sees unit-head + employee + profile",
  ids(mk("UnitHead")),
  ["employee", "profile", "unit-head"],
);
eq("Editor (no roles) sees admin + profile", ids(mk("Editor")), ["admin", "profile"]);

// Module gating: no incident_patrol -> no patrol panel, even for Patrol level.
// /employee survives because it is not module-gated as a whole.
eq(
  "Patrol without module loses /patrol but keeps /employee",
  ids(mk("Patrol", [], ["charts", "warehouse"])),
  ["employee", "profile"],
);
eq(
  "Patrol with module gets /patrol",
  ids(mk("Patrol")),
  ["employee", "patrol", "profile"],
);

// profile must never be gated away
for (const level of ["Ghost", "Manager", "Editor", "Enterprise", "Patrol", null]) {
  const found = getAccessiblePanels(mk(level, [], [])).some((p) => p.id === "profile");
  eq(`profile reachable for level=${level}`, found, true);
}

// ------------------------------------------------------------------ canAccessPanel
const panel = (id) => PANEL_DEFINITIONS.find((p) => p.id === id);
eq("admin denied to OrgHead", canAccessPanel(mk("OrgHead"), panel("admin")), false);
eq("admin allowed to Editor", canAccessPanel(mk("Editor"), panel("admin")), true);
eq("profile allowed to everyone", canAccessPanel(mk("Patrol", [], []), panel("profile")), true);
eq(
  "patrol denied without module",
  canAccessPanel(mk("Patrol", [], ["warehouse"]), panel("patrol")),
  false,
);

// -------------------------------------------------------------------- nav + shell
const navIds = (v, p) => filterPanelSections(PANEL_NAV[p].sections, v).flatMap((s) => s.items.map((i) => i.href));
const EMPLOYEE = mk("Patrol");
eq("employee nav for Patrol includes map", navIds(EMPLOYEE, "employee").includes("/employee/map"), true);
eq(
  "employee nav for Patrol includes reports",
  navIds(EMPLOYEE, "employee").includes("/employee/reports"),
  true,
);
// Warehouse section is module-gated: drop the module and the link disappears.
eq(
  "employee nav hides warehouse without module",
  navIds(mk("Patrol", [], ["incident_patrol"]), "employee").includes("/employee/warehouse"),
  false,
);
// The patrol-gated group must not leak to a plain Enterprise employee.
eq(
  "employee nav hides patrol group for Enterprise",
  navIds(mk("Enterprise"), "employee").some((h) => h.startsWith("/employee/reports")),
  false,
);

eq("isNavItemActive exact", isNavItemActive("/employee", "/employee"), true);
eq("isNavItemActive nested", isNavItemActive("/employee/map", "/employee"), true);
eq("isNavItemActive sibling prefix", isNavItemActive("/employee-other", "/employee"), false);

// ------------------------------------------------------------- dynamic form builder
// `/forms` is reachable from both authoring panels, gated on the `forms`
// module alone. These assertions exist because the link was once missing from
// the nav entirely and nothing failed.
eq(
  "orghead nav reaches /forms when the forms module is on",
  navIds(mk("OrgHead"), "orghead").includes("/forms"),
  true,
);
eq(
  "unit-head nav reaches /forms when the forms module is on",
  navIds(mk("UnitHead"), "unit-head").includes("/forms"),
  true,
);
eq(
  "orghead nav hides /forms when the forms module is off",
  navIds(mk("OrgHead", [], ["charts", "incident_patrol"]), "orghead").includes("/forms"),
  false,
);
eq(
  "orghead nav hides /forms when only patrol is on",
  navIds(mk("OrgHead", [], ["incident_patrol"]), "orghead").includes("/forms"),
  false,
);
// The two gates are independent: patrol off must not take the builder with it.
eq(
  "orghead nav keeps /forms when patrol is off but forms is on",
  navIds(mk("OrgHead", [], ["forms"]), "orghead").includes("/forms"),
  true,
);
eq(
  "unit-head nav keeps /forms when patrol is off but forms is on",
  navIds(mk("UnitHead", [], ["forms"]), "unit-head").includes("/forms"),
  true,
);
// Authoring is for org/unit leaders only — it must not leak to the rank and file.
eq(
  "employee nav never reaches /forms",
  navIds(mk("Patrol"), "employee").includes("/forms"),
  false,
);
eq(
  "patrol nav never reaches /forms",
  navIds(mk("Patrol"), "patrol").includes("/forms"),
  false,
);
eq(
  "patrol-manager nav never reaches /forms",
  navIds(mk("Manager"), "patrol-manager").includes("/forms"),
  false,
);
// Ghost is exempt from module gating, so the builder stays reachable for it.
// This must go through `makePanelViewer`, not the `mk()` mock: the Ghost
// exemption lives in the factory, and `itemVisible` consults `orgHasModule`
// before its own super-viewer bypass.
eq(
  "orghead nav reaches /forms for Ghost despite no modules",
  navIds(makePanelViewer({ level: "Ghost", roles: [], modules: [] }), "orghead").includes(
    "/forms",
  ),
  true,
);
// `/forms` is a flat top-level route, not nested under its panel, so the nav
// item must stay active across the builder's own sub-routes.
eq("isNavItemActive /forms on /forms", isNavItemActive("/forms", "/forms"), true);
eq("isNavItemActive /forms on /forms/new", isNavItemActive("/forms/new", "/forms"), true);
eq(
  "isNavItemActive /forms on /forms/:id",
  isNavItemActive("/forms/abc123", "/forms"),
  true,
);

// ------------------------------------------------------------- makePanelViewer
const viewer = makePanelViewer({
  level: "Editor",
  roles: [orgRole("OrgHead")],
  modules: ["charts"],
  orgModules: ["charts", "warehouse"],
});
eq("makePanelViewer level", viewer.level, "Editor");
eq("makePanelViewer hasModule(charts)", viewer.hasModule("charts"), true);
eq("makePanelViewer hasModule(warehouse) install-level", viewer.hasModule("warehouse"), false);
eq("makePanelViewer orgHasModule(warehouse)", viewer.orgHasModule("warehouse"), true);

// ------------------------------------------------------- route-builder invariant
// Every org/unit URL a component renders must come from a route builder. This is
// the assertion that would have caught the original defect: twelve components
// hardcoded `/org/${orgId}/…`, so drilling down from `/orghead` ejected the user
// into the legacy workspace and six `/orghead` routes were unreachable.
eq("orgRoutes.dashboard()", orgRoutes.dashboard(), "/orghead");
eq("orgRoutes.orgChart()", orgRoutes.orgChart(), "/orghead/org-chart");
eq("orgRoutes.units()", orgRoutes.units(), "/orghead/units");
eq("orgRoutes.unitNew()", orgRoutes.unitNew(), "/orghead/units/new");
eq("orgRoutes.unit(id)", orgRoutes.unit("u1"), "/orghead/units/u1");
eq("orgRoutes.people()", orgRoutes.people(), "/orghead/people");
eq("orgRoutes.personNew()", orgRoutes.personNew(), "/orghead/people/add");
eq("orgRoutes.person(id)", orgRoutes.person("p1"), "/orghead/people/p1");
eq("orgRoutes.processes()", orgRoutes.processes(), "/orghead/processes");
eq("orgRoutes.processNew()", orgRoutes.processNew(), "/orghead/processes/new");
eq("orgRoutes.process(id)", orgRoutes.process("x1"), "/orghead/processes/x1");
eq("orgRoutes.reports()", orgRoutes.reports(), "/orghead/reports");
eq("orgRoutes.report(id)", orgRoutes.report("r1"), "/orghead/reports/r1");
eq("orgRoutes.settings()", orgRoutes.settings(), "/orghead/settings");
eq("orgRoutes.warehouse()", orgRoutes.warehouse(), "/orghead/warehouse");

eq("unitHeadRoutes.dashboard()", unitHeadRoutes.dashboard(), "/unit-head");
eq("unitHeadRoutes.members()", unitHeadRoutes.members(), "/unit-head/members");
eq("unitHeadRoutes.orgChart()", unitHeadRoutes.orgChart(), "/unit-head/org-chart");
eq("unitHeadRoutes.reports()", unitHeadRoutes.reports(), "/unit-head/reports");
eq("unitHeadRoutes.report(id)", unitHeadRoutes.report("r1"), "/unit-head/reports/r1");
eq("unitHeadRoutes.warehouse()", unitHeadRoutes.warehouse(), "/unit-head/warehouse");

eq("employeeRoutes.dashboard()", employeeRoutes.dashboard(), "/employee");
eq("employeeRoutes.warehouse()", employeeRoutes.warehouse(), "/employee/warehouse");
eq("employeeRoutes.reports()", employeeRoutes.reports(), "/employee/reports");
eq("employeeRoutes.report(id)", employeeRoutes.report("r1"), "/employee/reports/r1");
eq("employeeRoutes.map()", employeeRoutes.map(), "/employee/map");
eq("employeeRoutes.announcements()", employeeRoutes.announcements(), "/employee/announcements");

// --------------------------------------------------------------- R4: forms role gate
// `canAuthorForms` decides *who* may author; licensing is ModuleGate's job in
// `/forms/layout.tsx`, and the nav entry hides itself via `requiredModule`.
// The Python side of R4 asserts those three agree. These assertions exist because
// the rule lived inside a React component, so it had no test at all.
eq("canAuthorForms allows Ghost", canAuthorForms(mk("Ghost")), true);
eq("canAuthorForms allows Manager", canAuthorForms(mk("Manager")), true);
eq("canAuthorForms allows OrgHead by level", canAuthorForms(mk("OrgHead")), true);
eq("canAuthorForms allows UnitHead by level", canAuthorForms(mk("UnitHead")), true);
eq("canAuthorForms allows an OrgHead by role on an Editor level", canAuthorForms(mk("Editor", [orgRole("OrgHead")])), true);
eq("canAuthorForms allows a UnitHead by role on an Editor level", canAuthorForms(mk("Editor", [unitRole("UnitHead")])), true);
eq("canAuthorForms refuses a Patrol officer", canAuthorForms(mk("Patrol")), false);
eq("canAuthorForms refuses an Enterprise user", canAuthorForms(mk("Enterprise")), false);
eq("canAuthorForms refuses a plain Editor", canAuthorForms(mk("Editor")), false);
eq("canAuthorForms refuses a generic Officer", canAuthorForms(mk("Editor", [orgRole("Officer")])), false);

// One section definition, shared by both authoring panels. Two copies is how
// they drifted before, and the guard has to agree with both.
eq(
  "ORGHEAD_NAV uses the shared forms section",
  ORGHEAD_NAV.sections.some((s) => s.label === formsNavSection().label && s.requiredModule === "forms"),
  true,
);
eq(
  "UNIT_HEAD_NAV uses the shared forms section",
  PANEL_NAV["unit-head"].sections.some((s) => s.label === formsNavSection().label && s.requiredModule === "forms"),
  true,
);

// ------------------------------------------------------------------- nav reachability
// R2 — a nav href and the detail routes under it must agree. Six `/orghead`
// routes were unreachable because their `/org/[orgId]` twins were the wired-up
// ones, so drilling down from the panel left the panel entirely.
const orgNavIds = filterPanelSections(PANEL_NAV.orghead.sections, mk("OrgHead")).flatMap((s) => s.items.map((i) => i.href));
for (const route of ["/orghead/units/new", "/orghead/people/add", "/orghead/processes/new"]) {
  const parent = "/" + route.split("/").slice(1, 3).join("/");
  eq(`orghead nav links the parent of ${route}`, orgNavIds.includes(parent), true);
}
const unitNavIds = filterPanelSections(PANEL_NAV["unit-head"].sections, mk("UnitHead")).flatMap((s) => s.items.map((i) => i.href));
// The legacy workspace is deleted; no nav may still point into it.
eq("orghead nav has no link into the deleted /org workspace", orgNavIds.some((h) => h.startsWith("/org/")), false);
eq("unit-head nav has no link into the deleted /org workspace", unitNavIds.some((h) => h.startsWith("/org/")), false);
eq("employee nav has no link into the deleted /org workspace", filterPanelSections(PANEL_NAV.employee.sections, mk("Patrol")).flatMap((s) => s.items.map((i) => i.href)).some((h) => h.startsWith("/org/")), false);
// Panel roots must match their registry definition, so a panel renamed in
// PANEL_DEFINITIONS cannot leave its nav pointing at the old path.
eq("orghead nav root matches PANEL_DEFINITIONS", orgNavIds.includes(getPanelById("orghead").path), true);
eq("unit-head nav root matches PANEL_DEFINITIONS", unitNavIds.includes(getPanelById("unit-head").path), true);

// `forms` must stay last. `moduleKeyFor` on the backend
// (`back/src/app_modules/moduleConfig.ts`) returns on the FIRST matching key,
// and `incident_patrol` registers a whole-schema `incident_report.*` wildcard
// that would otherwise shadow `form_definition` — the gate would never run, so
// authoring would stay reachable with the module switched off. The frontend list
// has no resolver, but it must mirror the backend's order or the two licensing
// screens disagree about what is licensed.
eq("MODULE_KEYS order", MODULE_KEYS, ["charts", "incident_patrol", "warehouse", "forms"]);
eq("MODULE_KEYS is last-position forms", MODULE_KEYS[MODULE_KEYS.length - 1], "forms");
eq("MODULE_KEYS covers every labelled module", MODULE_KEYS.length, Object.keys(MODULE_LABELS).length);
eq(
  "MODULE_LABELS covers every MODULE_KEY",
  MODULE_KEYS.every((k) => typeof MODULE_LABELS[k] === "string"),
  true,
);

// ------------------------------------------------- every analytics act is reachable
// Four analytics were fully built pages that no navigation listed, so they were
// reachable only by typing a URL. The temporal index even defined a card for
// damage-analytics that never rendered, because the page renders
// getSectionCharts() instead — dead metadata proving the omission was a bug.
const EXPECTED_SECTION_HREFS = {
  overall: [
    "/charts/overall/road-defects",
    "/charts/overall/monthly-holiday",
    "/charts/overall/hourly-day-of-week",
    "/charts/overall/collision-analytics",
    "/charts/overall/accident-severity",
    "/charts/overall/area-usage-analytics",
    "/charts/overall/total-reason-analytics",
    "/charts/overall/human-reason-analytics",
    "/charts/overall/vehicle-reason-analytics",
    "/charts/overall/company-performance-analytics",
  ],
  temporal: [
    "/charts/temporal/count-analytics",
    "/charts/temporal/severity-analytics",
    "/charts/temporal/night-analytics",
    "/charts/temporal/collision-analytics",
    "/charts/temporal/total-reason-analytics",
    "/charts/temporal/unlicensed-drivers-analytics",
    "/charts/temporal/damage-analytics",
  ],
  spatial: [
    "/charts/spatial/severity-analytics",
    "/charts/spatial/light-analytics",
    "/charts/spatial/collision-analytics",
    "/charts/spatial/safety-index",
    "/charts/spatial/single-vehicle-analytics",
  ],
  trend: ["/charts/trend/severity-analytics", "/charts/trend/collision-analytics"],
};
for (const [section, expected] of Object.entries(EXPECTED_SECTION_HREFS)) {
  eq(`${section} section hrefs`, getSectionCharts(section).map((c) => c.href), expected);
}
// Every entry needs an Enterprise permission mapping, or an Enterprise viewer
// looks the chart up by its own id and gets nothing.
for (const [section, expected] of Object.entries(EXPECTED_SECTION_HREFS)) {
  const missing = getSectionCharts(section).filter((c) => !isChartAccessible(c.id, null, null));
  eq(`${section} ids all resolvable`, missing.length, 0);
}

// ------------------------------------------------------- readable must mean reachable
// `announcement.gets` is `grantAccess({ levels: ["Manager", "Patrol"] })`, so a
// Manager could read announcements while the only nav entry sat inside
// EMPLOYEE_NAV's Patrol-gated section. Readable but unreachable is a bug the
// type-checker cannot see.
eq(
  "patrol-manager nav reaches announcements for a Manager",
  filterPanelSections(PANEL_NAV["patrol-manager"].sections, mk("Manager"))
    .flatMap((s) => s.items.map((i) => i.href))
    .includes("/employee/announcements"),
  true,
);
eq(
  "patrol nav never reaches announcements (Patrol has its own panel entry)",
  filterPanelSections(PANEL_NAV.patrol.sections, mk("Patrol"))
    .flatMap((s) => s.items.map((i) => i.href))
    .includes("/employee/announcements"),
  false,
);
eq(
  "orghead nav never reaches announcements",
  filterPanelSections(PANEL_NAV.orghead.sections, mk("OrgHead"))
    .flatMap((s) => s.items.map((i) => i.href))
    .includes("/employee/announcements"),
  false,
);

// ------------------------------------------------------------------------- report
console.log(`\n${pass} assertions passed`);
if (failures.length) {
  console.log(`${failures.length} FAILED:\n`);
  for (const f of failures) console.log(`  x ${f}`);
  process.exit(1);
}
console.log("all panel routing assertions pass\n");
