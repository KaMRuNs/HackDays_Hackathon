export type Strategy = "analogy" | "example" | "step_by_step";
export type ConceptState = "demonstrated" | "partial" | "missing";
export type GapStatus = "open" | "practiced" | "resolved";

export interface Explanation {
  simple: string;
  analogy: string;
  technical_definition: string;
  check_question: string;
}

export interface CheckResult {
  correct: boolean;
  feedback: string;
  misconception: string | null;
  next_strategy: Strategy;
}

export interface CriterionScore {
  name: "core_concepts" | "technical_correctness" | "reasoning" | "clarity";
  score: number;
  max_score: number;
  evidence: string[];
}

export interface VivaEval {
  criteria: CriterionScore[];
  concept_statuses: { concept_id: string; status: ConceptState }[];
  feedback: string;
  follow_up_question: string | null;
}

export interface VivaTurnResult {
  eval: VivaEval;
  total: number;
  max_total: number;
  done: boolean;
  next_question: string | null;
}

export interface Subject {
  id: string;
  title: string;
  question_count: number;
  concepts: Record<string, string>;
}

export interface Gap {
  concept_id: string;
  meaning: string;
  status: GapStatus;
  attempt_count: number;
  last_evidence: string | null;
  session_id: number | null;
  updated_at: string;
}
