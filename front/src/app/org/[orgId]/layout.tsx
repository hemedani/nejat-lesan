export default async function OrgIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Per-org module gating happens in the shell (OrgWorkspace); this layout is a
  // pass-through so every /org/[orgId] page is covered by the same gate.
  return <>{children}</>;
}
