import { useEffect, useState } from "react";
import { Square, Volume2 } from "lucide-react";

// Browser built-in speech synthesis (Web Speech API): no API key, no external model.
export const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

export function speak(text: string, onEnd?: () => void) {
  if (!canSpeak) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.95;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("en"));
  if (voice) u.voice = voice;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

export default function SpeakButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => { if (canSpeak) window.speechSynthesis.cancel(); }, []);
  if (!canSpeak) return null;

  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speak(text, () => setSpeaking(false));
    }
  };

  return (
    <button
      onClick={toggle}
      title={speaking ? "Stop" : "Read question aloud"}
      aria-label={speaking ? "Stop reading" : "Read question aloud"}
      className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/30"
    >
      {speaking ? <Square size={14} /> : <Volume2 size={14} />}
      {speaking ? "Stop" : "Read aloud"}
    </button>
  );
}
