/**
 * `/org` is now only a forwarding route (see `OrgLanding`); the workspace chrome
 * lives on `/org/[orgId]` so the index page can redirect before any role gate
 * renders.
 */
export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
