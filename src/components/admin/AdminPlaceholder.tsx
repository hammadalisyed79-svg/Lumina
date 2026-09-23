export function AdminPlaceholder({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="admin-panel">
      <h1 className="admin-h1">{title}</h1>
      <p className="admin-muted mb-4">Scheduled for {phase}</p>
      <p className="admin-body">{description}</p>
      <p className="admin-muted mt-6 text-sm">
        This shell route is live so navigation and permissions can be wired now. Full CRUD arrives
        in the phase above — not a finished module.
      </p>
    </div>
  );
}
