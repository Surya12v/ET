export const DEFAULT_CATEGORIES: { name: string; color: string; icon: string }[] = [
  { name: "Food & Dining", color: "#B4533B", icon: "🍔" },
  { name: "Transport", color: "#35506B", icon: "🚗" },
  { name: "Housing", color: "#6B4E71", icon: "🏠" },
  { name: "Utilities", color: "#3F6357", icon: "💡" },
  { name: "Shopping", color: "#A56B72", icon: "🛍️" },
  { name: "Health", color: "#7C7A3B", icon: "💊" },
  { name: "Entertainment", color: "#B08D3E", icon: "🎬" },
  { name: "Travel", color: "#5B6470", icon: "✈️" },
  { name: "Education", color: "#4A5C6A", icon: "📚" },
  { name: "Other", color: "#8A8272", icon: "📦" },
];

// A muted, editorial palette used for charts — deliberately avoids the
// default bright rainbow most chart libraries ship with.
export const CHART_PALETTE = [
  "#B08D3E", // bronze
  "#3F6357", // deep sage
  "#B4533B", // terracotta
  "#35506B", // ink blue
  "#6B4E71", // plum
  "#7C7A3B", // olive
  "#A56B72", // dusty rose
  "#5B6470", // slate
];

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "NGN", "CAD", "AUD", "JPY"] as const;

export const PAYMENT_METHODS = ["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Mobile Money", "Other"] as const;

export const RECURRENCE_INTERVALS = ["weekly", "monthly", "yearly"] as const;

export const INCOME_SOURCES = ["Salary", "Freelance", "Business", "Interest", "Dividends", "Gift", "Rental", "Other"] as const;
