export type RecurrenceInterval = "weekly" | "monthly" | "yearly";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  currency: string;
  description: string | null;
  merchant: string | null;
  payment_method: string | null;
  expense_date: string;
  receipt_url: string | null;
  is_recurring: boolean;
  recurrence_interval: RecurrenceInterval | null;
  parent_recurring_id: string | null;
  created_at: string;
  category?: Category | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  created_at: string;
  category?: Category | null;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  default_currency: string;
}
