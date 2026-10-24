import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { api } from "../api/client";
import type { Subject, VivaTurnResult } from "../api/types";
import ErrorBanner from "../components/ErrorBanner";
import GapChip from "../components/GapChip";
import Loader from "../components/Loader";
import RubricScoreCard from "../components/RubricScoreCard";
import SubjectTile from "../components/SubjectTile";

const PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY as string | undefined;
const PUBLIC_API_URL = import.meta.env.VITE_PUBLIC_API_URL as string | undefined;
const VOICE = (import.meta.env.VITE_VAPI_VOICE as string | undefined) || "Clara";

type Phase = "pick" | "connecting" | "live" | "grading" | "done";
interface Line { role: "examiner" | "student"; text: string }

export default function InterviewPage() {
  const vapiRef = useRef<Vapi | null>(null);
  const linesRef = useRef<Line[]>([]);
  const sessionRef = useRef<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [phase, setPhase] = useState<Phase>("pick");
  const [lines, setLines] = useState<Line[]>([]);
  const [partial, setPartial] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [muted, setMuted] = useState(false);
  const [result, setResult] = useState<VivaTurnResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const configured = !!PUBLIC_KEY && !!PUBLIC_API_URL;

  useEffect(() => {
    api.subjects().then(setSubjects).catch((e) => setError((e as Error).message));
    return () => { vapiRef.current?.stop(); };
  }, []);

  const addLine = (line: Line) => {
    linesRef.current = [...linesRef.current, line];
    setLines(linesRef.current);
  };

  // Grade the whole spoken interview with the same Gemma rubric grader used by the text viva.
  const grade = async () => {
    const studentText = linesRef.current.filter((l) => l.role === "student").map((l) => l.text).join(" ");
    if (!sessionRef.current || !studentText.trim()) {
      setError("No spoken answers were captured, so there is nothing to grade.");
      setPhase("pick");
      return;
    }
    setPhase("grading");
    try {
      setResult(await api.answerViva(sessionRef.current, studentText.slice(0, 6000), true));
      setPhase("done");
    } catch (e) {
      setError((e as Error).message);
      setPhase("done");
    }
  };

  const start = async (s: Subject) => {
    setSubject(s);
    setError(null);
    setResult(null);
    linesRef.current = [];
    setLines([]);
    setPhase("connecting");
    try {
      const interview = await api.startInterview(s.id);
      sessionRef.current = interview.session_id;

      const vapi = new Vapi(PUBLIC_KEY!);
      vapiRef.current = vapi;
      vapi.on("call-start", () => setPhase("live"));
      vapi.on("speech-start", () => setSpeaking(true));
      vapi.on("speech-end", () => setSpeaking(false));
      vapi.on("volume-level", (v: number) => setVolume(v));
      vapi.on("message", (m: any) => {
        if (m.type !== "transcript") return;
        if (m.transcriptType === "partial") {
          if (m.role === "user") setPartial(m.transcript);
          return;
        }
        if (m.role === "user") setPartial("");
        addLine({ role: m.role === "user" ? "student" : "examiner", text: m.transcript });
      });
      vapi.on("call-end", () => {
        setSpeaking(false);
        vapiRef.current = null;
        grade();
      });
      vapi.on("error", (e: any) => {
        setError(e?.error?.message || e?.message || "The voice call failed. Check the Vapi key and the public API URL.");
      });

      await vapi.start({
        name: "VivaBridge Examiner",
        firstMessage: interview.first_message,
        model: {
          provider: "custom-llm",
          url: `${PUBLIC_API_URL}/api/vapi`,
          model: "gemma4",
          messages: [{ role: "system", content: interview.system_prompt }],
        },
        voice: { provider: "vapi", voiceId: VOICE },
        transcriber: { provider: "deepgram", model: "nova-2", language: "en" },
        maxDurationSeconds: 600,
        endCallPhrases: ["that concludes your viva"],
      } as any);
    } catch (e) {
      setError((e as Error).message || "Could not start the voice interview.");
      setPhase("pick");
    }
  };

  const toggleMute = () => {
    if (!vapiRef.current) return;
    vapiRef.current.setMuted(!muted);
    setMuted(!muted);
  };

  const gapIds = result
    ? result.eval.concept_statuses.filter((s) => s.status !== "demonstrated").map((s) => s.concept_id)
    : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div>
        <p className="text-sm font-semibold text-accent">Live voice viva</p>
        <h1 className="text-3xl font-extrabold text-primary">Talk to your examiner</h1>
        <p className="mt-2 text-ink/60">
          A spoken mock viva. The examiner asks out loud, listens to your answer and probes your weak spots. At the end,
          your full answer is graded on the same rubric.
        </p>
      </div>

      {!configured && (
        <ErrorBanner message="Voice interview is not configured. Set VITE_VAPI_PUBLIC_KEY and VITE_PUBLIC_API_URL in frontend/.env, then restart the dev server." />
      )}
      {error && <ErrorBanner message={error} />}

      {phase === "pick" && (
        <div className="grid gap-5 sm:grid-cols-2">
          {subjects.map((s) => (
            <SubjectTile key={s.id} subject={s} onClick={() => start(s)} disabled={!configured} />
          ))}
        </div>
      )}

      {phase === "connecting" && <Loader label="Calling your examiner…" />}

      {(phase === "live" || phase === "grading" || phase === "done") && subject && (
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <div className="card flex flex-col items-center gap-5 bg-gradient-to-b from-primary to-primary-dark text-white">
            <p className="text-sm font-semibold opacity-80">{subject.title}</p>
            <div
              className="grid h-36 w-36 place-items-center rounded-full bg-white/10 transition-transform duration-100"
              style={{ transform: `scale(${1 + (phase === "live" ? volume * 0.6 : 0)})` }}
            >
              <div className={`grid h-24 w-24 place-items-center rounded-full ${speaking ? "bg-accent" : "bg-white/20"}`}>
                <span className="text-3xl font-extrabold">DN</span>
              </div>
            </div>
            <p className="font-semibold">
              {phase === "live" ? (speaking ? "Examiner is speaking…" : "Listening to you…") : "Call ended"}
            </p>
            {phase === "live" && (
              <div className="flex gap-3">
                <button onClick={toggleMute} className="btn bg-white/15 px-4 py-2 text-white hover:bg-white/25">
                  {muted ? <MicOff size={18} /> : <Mic size={18} />} {muted ? "Unmute" : "Mute"}
                </button>
                <button onClick={() => vapiRef.current?.stop()} className="btn-accent px-4 py-2">
                  <PhoneOff size={18} /> End
                </button>
              </div>
            )}
          </div>

          <div className="card max-h-[460px] space-y-3 overflow-y-auto">
            <p className="text-sm font-semibold text-ink/50">Live transcript</p>
            {lines.map((l, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                  l.role === "examiner" ? "rounded-tl-none bg-primary text-white" : "ml-auto rounded-tr-none bg-lavender"
                }`}
              >
                {l.text}
              </div>
            ))}
            {partial && <div className="ml-auto max-w-[85%] rounded-2xl bg-lavender/60 p-3 text-sm italic text-ink/60">{partial}…</div>}
          </div>
        </div>
      )}

      {phase === "grading" && <Loader label="Grading your spoken answers on the rubric…" />}

      {phase === "done" && result && (
        <>
          <RubricScoreCard ev={result.eval} total={result.total} max={result.max_total} />
          <div className="card space-y-4">
            {gapIds.length ? (
              <>
                <p className="text-ink/70">Concepts to work on. Learn each one, then prove it on a new question.</p>
                <div className="flex flex-wrap gap-2">
                  {gapIds.map((id) => (
                    <GapChip key={id} conceptId={id} meaning={subject?.concepts[id] ?? id} subject={subject!.id} />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-emerald-700">Every concept was demonstrated. Excellent viva!</p>
            )}
            <button className="btn-ghost" onClick={() => setPhase("pick")}>Start another interview</button>
          </div>
        </>
      )}
    </div>
  );
}
