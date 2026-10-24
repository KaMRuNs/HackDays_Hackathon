import type { CheckResult, Explanation, Gap, Strategy, Subject, VivaTurnResult } from "./types";

async function request<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const detail = typeof data?.detail === "string" ? data.detail : `Request failed (${res.status})`;
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  explain: (concept: string, strategy?: Strategy) =>
    request<Explanation>("/api/learn/explain", { concept, strategy }),
  check: (concept: string, question: string, answer: string, concept_id?: string) =>
    request<CheckResult>("/api/learn/check", { concept, question, answer, concept_id }),
  subjects: () => request<Subject[]>("/api/subjects"),
  startViva: (subject: string, concept_ids?: string[]) =>
    request<{ session_id: number; question: string; question_id: string }>("/api/viva/start", { subject, concept_ids }),
  answerViva: (sessionId: number, text: string) =>
    request<VivaTurnResult>(`/api/viva/${sessionId}/answer`, { text }),
  gaps: () => request<Gap[]>("/api/gaps"),
};
