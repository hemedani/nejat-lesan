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
    <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-8 text-center text-rose-100">
      {message}
    </div>
  );
}
