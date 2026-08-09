import { Heart, LockKeyhole, Sparkles } from "lucide-react";

export function FlowHeader({
  label,
  privateView = false,
}: {
  label: string;
  privateView?: boolean;
}) {
  return (
    <header className="flow-header">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="flow-brand" aria-label="A Little Invite home">
        <span>
          <Heart size={18} fill="currentColor" aria-hidden="true" />
        </span>
        <div>
          <strong>A Little Invite</strong>
          <small>Make a moment, not a message.</small>
        </div>
      </a>
      <span className="flow-header-label" aria-label={label}>
        {privateView ? (
          <LockKeyhole size={16} aria-hidden="true" />
        ) : (
          <Sparkles size={16} aria-hidden="true" />
        )}
        <span>{label}</span>
      </span>
    </header>
  );
}
