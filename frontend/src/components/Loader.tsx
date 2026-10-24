import { useEffect, useState } from "react";

export default function Loader({ label }: { label: string }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card flex items-center gap-4 bg-lavender shadow-none">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <div>
        <p className="font-semibold text-primary">{label}</p>
        <p className="text-sm text-ink/60">
          Gemma is thinking on this laptop. This can take up to a minute ({seconds}s).
        </p>
      </div>
    </div>
  );
}
