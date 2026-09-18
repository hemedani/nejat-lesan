/**
 * Icon set for the role panels.
 *
 * Kept local (instead of extending `components/atoms/Icons.tsx`) so the panel
 * layer stays self-contained and adding a nav item never requires touching the
 * shared icon module.
 */

export type PanelIconName =
  | "dashboard"
  | "building"
  | "network"
  | "units"
  | "users"
  | "user"
  | "workflow"
  | "reports"
  | "clipboard"
  | "warehouse"
  | "package"
  | "activity"
  | "bell"
  | "file"
  | "store"
  | "map"
  | "road"
  | "settings"
  | "shield"
  | "plus"
  | "menu"
  | "close"
  | "chevron"
  | "logout";

const PATHS: Record<PanelIconName, string[]> = {
  dashboard: ["M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"],
  building: ["M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 9h2a2 2 0 0 1 2 2v10M9 7h2M9 11h2M9 15h2"],
  network: ["M9 3h6v4H9zM2 17h6v4H2zM16 17h6v4h-6zM12 7v4M5 17v-3h14v3"],
  units: ["M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9"],
  users: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  ],
  user: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
  workflow: ["M4 4h6v6H4zM14 14h6v6h-6zM7 10v2a4 4 0 0 0 4 4h3"],
  reports: ["M9 3h6v3H9zM8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M8 12h8M8 16h5"],
  clipboard: ["M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6v4H9z"],
  warehouse: ["M3 21V9l9-6 9 6v12M9 21v-6h6v6"],
  package: ["M12 2 3 7v10l9 5 9-5V7l-9-5zM3 7l9 5 9-5M12 12v10"],
  activity: ["M22 12h-4l-3 9L9 3l-3 9H2"],
  bell: ["M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"],
  file: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6"],
  store: ["M3 9 5 3h14l2 6M3 9h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM8 21v-6h8v6"],
  map: ["M12 21s-7-6.3-7-11a7 7 0 1 1 14 0c0 4.7-7 11-7 11z", "M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"],
  road: ["M4 3v18M20 3v18M12 5v3M12 12v3M12 19v1"],
  settings: [
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    "M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  ],
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  plus: ["M12 5v14M5 12h14"],
  menu: ["M3 6h18M3 12h18M3 18h18"],
  close: ["M18 6 6 18M6 6l12 12"],
  chevron: ["m6 9 6 6 6-6"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"],
};

export function PanelIcon({
  name,
  className = "h-5 w-5",
}: {
  name: PanelIconName;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
