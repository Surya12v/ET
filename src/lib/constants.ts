export const DEFAULT_CATEGORIES: { name: string; color: string; icon: string }[] = [
  { name: "Food & Dining", color: "#f97316", icon: "🍔" },
  { name: "Transport", color: "#3b82f6", icon: "🚗" },
  { name: "Housing", color: "#8b5cf6", icon: "🏠" },
  { name: "Utilities", color: "#06b6d4", icon: "💡" },
  { name: "Shopping", color: "#ec4899", icon: "🛍️" },
  { name: "Health", color: "#ef4444", icon: "💊" },
  { name: "Entertainment", color: "#eab308", icon: "🎬" },
  { name: "Travel", color: "#14b8a6", icon: "✈️" },
  { name: "Education", color: "#6366f1", icon: "📚" },
  { name: "Other", color: "#64748b", icon: "📦" },
];

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "NGN", "CAD", "AUD", "JPY"] as const;

export const PAYMENT_METHODS = ["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Mobile Money", "Other"] as const;

export const RECURRENCE_INTERVALS = ["weekly", "monthly", "yearly"] as const;
