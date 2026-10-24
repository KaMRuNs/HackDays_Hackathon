import { AlertTriangle } from "lucide-react";

export default function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-accent/30 bg-accent-light p-4 text-ink">
      <AlertTriangle className="shrink-0 text-accent" />
      <p className="flex-1 text-sm">{message}</p>
      {onRetry && (
        <button className="btn-accent px-4 py-2 text-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
