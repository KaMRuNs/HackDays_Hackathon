import { Link } from "react-router-dom";
import { ArrowRight, Mic } from "lucide-react";
import LoopSteps from "../components/LoopSteps";

export default function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-br from-lavender via-white to-accent-light/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="rounded-full bg-white px-4 py-1 text-sm font-semibold text-accent shadow-soft">
              Your personal lab viva coach
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-primary sm:text-5xl">
              Understand it.
              <br />
              Explain it.
              <br />
              <span className="text-accent">Defend it.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-ink/70">
              Stop memorizing viva answers. VivaBridge explains concepts simply, examines you like a real teacher, and
              shows exactly which ideas you're missing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/learn" className="btn-primary">
                Start learning <ArrowRight size={18} />
              </Link>
              <Link to="/viva" className="btn-ghost">
                <Mic size={18} /> Take a mock viva
              </Link>
            </div>
          </div>

          <div className="card relative mx-auto w-full max-w-md space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Mock viva · Computer Networks</p>
            <div className="rounded-2xl bg-primary p-4 text-white">Explain the TCP three-way handshake.</div>
            <div className="ml-8 rounded-2xl bg-lavender p-4 text-sm">
              Client sends SYN, the server replies SYN-ACK, then data starts…
            </div>
            <div className="rounded-2xl border-2 border-accent/30 bg-accent-light p-4 text-sm">
              <b className="text-accent">Missing concept:</b> final ACK. Why is the third message needed?
            </div>
            <p className="text-center text-xs text-ink/40">Illustration of the flow, not a live result</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold text-primary">One loop. Real understanding.</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-ink/60">
          Every mistake becomes your next lesson. A gap only closes when you prove it on a brand-new question.
        </p>
        <div className="mt-10">
          <LoopSteps />
        </div>
      </section>
    </>
  );
}
