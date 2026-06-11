export type UserRole = "admin" | "csm";
export type CustomerStatus = "prospect" | "active" | "at_risk" | "churned";
export type InteractionType = "meeting" | "call" | "email" | "note";
export type Sentiment = "positive" | "neutral" | "negative";
export type InsightSource = "ai" | "fallback";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  status: CustomerStatus;
  owner_id: string;
  owner_name: string | null;
  interaction_count: number;
  created_at: string;
  updated_at: string;
}

export interface Insight {
  id: string;
  summary: string;
  sentiment: Sentiment;
  action_items: string[];
  risks: string[];
  source: InsightSource;
  model: string | null;
  error_message: string | null;
  generated_at: string;
}

export interface Interaction {
  id: string;
  customer_id: string;
  customer_name: string | null;
  type: InteractionType;
  title: string;
  notes: string;
  occurred_at: string;
  created_by: string;
  author_name: string | null;
  insight: Insight | null;
  created_at: string;
  updated_at: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface RecentInteraction {
  id: string;
  title: string;
  customer_name: string;
  type: InteractionType;
  sentiment: Sentiment | null;
  occurred_at: string;
}

export interface DashboardMetrics {
  total_customers: number;
  customers_by_status: Record<string, number>;
  total_interactions: number;
  interactions_last_30_days: number;
  sentiment_breakdown: Record<string, number>;
  insights_generated: number;
  recent_interactions: RecentInteraction[];
  cached: boolean;
}
