export const STAGES = [
  "NEW_LEAD",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  NEW_LEAD: "New Lead",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent",
  WON: "Won",
  LOST: "Lost",
};

export const STAGE_COLORS: Record<Stage, string> = {
  NEW_LEAD: "bg-slate-500",
  CONTACTED: "bg-blue-500",
  QUALIFIED: "bg-amber-500",
  PROPOSAL_SENT: "bg-purple-500",
  WON: "bg-emerald-500",
  LOST: "bg-rose-500",
};

// Client.status also accepts lead-scoring values set by the /api/leads/webhook
// route (outside the fixed Kanban stages above), so lookups go through these
// fallback-safe helpers instead of indexing STAGE_LABELS/STAGE_COLORS directly.
const EXTRA_STATUS_LABELS: Record<string, string> = {
  "Hot Lead - Call Now": "Hot Lead - Call Now",
  Nurture: "Nurture",
};

const EXTRA_STATUS_COLORS: Record<string, string> = {
  "Hot Lead - Call Now": "bg-red-600",
  Nurture: "bg-cyan-600",
};

export function statusLabel(status: string): string {
  return STAGE_LABELS[status as Stage] ?? EXTRA_STATUS_LABELS[status] ?? status;
}

export function statusColor(status: string): string {
  return STAGE_COLORS[status as Stage] ?? EXTRA_STATUS_COLORS[status] ?? "bg-slate-500";
}

export const EVENT_TYPES = ["FOLLOW_UP", "CALL", "MEETING", "OTHER"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  FOLLOW_UP: "Follow-up",
  CALL: "Scheduled Call",
  MEETING: "Meeting",
  OTHER: "Other",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  FOLLOW_UP: "#f59e0b",
  CALL: "#3b82f6",
  MEETING: "#8b5cf6",
  OTHER: "#64748b",
};

export const TRANSACTION_TYPES = ["INCOME", "EXPENSE"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CALL_OUTCOMES = [
  "NO_ANSWER",
  "NOT_INTERESTED",
  "CALLBACK_REQUESTED",
  "BOOKED_MEETING",
  "CLOSED",
] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];

export const CALL_OUTCOME_LABELS: Record<CallOutcome, string> = {
  NO_ANSWER: "No Answer",
  NOT_INTERESTED: "Not Interested",
  CALLBACK_REQUESTED: "Callback Requested",
  BOOKED_MEETING: "Booked Meeting",
  CLOSED: "Closed",
};

export const CALL_OUTCOME_COLORS: Record<CallOutcome, string> = {
  NO_ANSWER: "bg-slate-500",
  NOT_INTERESTED: "bg-rose-500",
  CALLBACK_REQUESTED: "bg-amber-500",
  BOOKED_MEETING: "bg-emerald-500",
  CLOSED: "bg-blue-500",
};

// ColdCall.outcome also accepts "Not Yet Called", set by the /api/leads/webhook
// route for leads that haven't been worked yet — same fallback pattern as above.
const EXTRA_OUTCOME_LABELS: Record<string, string> = {
  "Not Yet Called": "Not Yet Called",
};

const EXTRA_OUTCOME_COLORS: Record<string, string> = {
  "Not Yet Called": "bg-red-600",
};

export function outcomeLabel(outcome: string): string {
  return CALL_OUTCOME_LABELS[outcome as CallOutcome] ?? EXTRA_OUTCOME_LABELS[outcome] ?? outcome;
}

export function outcomeColor(outcome: string): string {
  return CALL_OUTCOME_COLORS[outcome as CallOutcome] ?? EXTRA_OUTCOME_COLORS[outcome] ?? "bg-slate-500";
}
