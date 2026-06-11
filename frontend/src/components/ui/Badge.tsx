import { ReactNode } from "react";
import type { CustomerStatus, InteractionType, Sentiment, InsightSource } from "@/types";

type Tone = "gray" | "green" | "red" | "yellow" | "blue" | "purple";

// Softer, theme-aware badge tones
const tones: Record<Tone, string> = {
  gray: "bg-[#F0EDE6] text-[#5A5A58] dark:bg-[#2A2A2A] dark:text-[#A0A09E]",
  green: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  red: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  yellow: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  purple: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
};

export interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export default function Badge({ tone = "gray", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// ----- Mapping helpers -----

const customerStatusMap: Record<CustomerStatus, { label: string; tone: Tone }> = {
  prospect: { label: "Prospect", tone: "blue" },
  active: { label: "Active", tone: "green" },
  at_risk: { label: "At Risk", tone: "yellow" },
  churned: { label: "Churned", tone: "red" },
};

export function customerStatusBadge(status: CustomerStatus): { label: string; tone: Tone } {
  return customerStatusMap[status];
}

const interactionTypeMap: Record<InteractionType, { label: string; tone: Tone }> = {
  meeting: { label: "Meeting", tone: "purple" },
  call: { label: "Call", tone: "blue" },
  email: { label: "Email", tone: "gray" },
  note: { label: "Note", tone: "gray" },
};

export function interactionTypeBadge(type: InteractionType): { label: string; tone: Tone } {
  return interactionTypeMap[type];
}

const sentimentMap: Record<Sentiment, { label: string; tone: Tone }> = {
  positive: { label: "Positive", tone: "green" },
  neutral: { label: "Neutral", tone: "gray" },
  negative: { label: "Negative", tone: "red" },
};

export function sentimentBadge(sentiment: Sentiment): { label: string; tone: Tone } {
  return sentimentMap[sentiment];
}

const sourceMap: Record<InsightSource, { label: string; tone: Tone }> = {
  ai: { label: "AI", tone: "purple" },
  fallback: { label: "Fallback", tone: "yellow" },
};

export function sourceBadge(source: InsightSource): { label: string; tone: Tone } {
  return sourceMap[source];
}

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const { label, tone } = customerStatusBadge(status);
  return <Badge tone={tone}>{label}</Badge>;
}

export function InteractionTypeBadge({ type }: { type: InteractionType }) {
  const { label, tone } = interactionTypeBadge(type);
  return <Badge tone={tone}>{label}</Badge>;
}

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const { label, tone } = sentimentBadge(sentiment);
  return <Badge tone={tone}>{label}</Badge>;
}

export function SourceBadge({ source }: { source: InsightSource }) {
  const { label, tone } = sourceBadge(source);
  return <Badge tone={tone}>{label}</Badge>;
}
