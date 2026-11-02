/**
 * Inline "you cannot see this" notice.
 *
 * Extracted from the old `PatrolWorkspace` so the panel layer no longer depends
 * on a specific workspace implementation.
 */
export function RoleNotice({
  message = "شما به این بخش دسترسی ندارید.",
}: {
  message?: string;
}) {
  return (
    <div className="tint-rose rounded-2xl border border-tint-border bg-tint-soft p-8 text-center text-tint-fg">
      {message}
    </div>
  );
}
