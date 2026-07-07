import type { Expense, Income, RecurrenceInterval } from "./types";

function periodKey(date: Date, interval: RecurrenceInterval) {
  if (interval === "yearly") return `${date.getFullYear()}`;
  if (interval === "weekly") {
    const first = new Date(date.getFullYear(), 0, 1);
    const week = Math.ceil(((date.getTime() - first.getTime()) / 86400000 + first.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${week}`;
  }
  return `${date.getFullYear()}-${date.getMonth()}`;
}

interface RecurringLike {
  id: string;
  recurrence_interval: RecurrenceInterval | null;
  parent_recurring_id: string | null;
}

// Generic core: returns true if `template` is still due to be generated for
// the current period (this week / month / year).
function isDueGeneric<T extends RecurringLike>(template: T, instances: T[], dateOf: (item: T) => string) {
  if (!template.recurrence_interval) return false;
  const now = new Date();
  const currentKey = periodKey(now, template.recurrence_interval);
  const templateKey = periodKey(new Date(dateOf(template)), template.recurrence_interval);
  if (templateKey === currentKey) return false; // the template itself already counts for this period
  return !instances.some(
    (i) => i.parent_recurring_id === template.id && periodKey(new Date(dateOf(i)), template.recurrence_interval!) === currentKey
  );
}

export function isExpenseDue(template: Expense, instances: Expense[]) {
  return isDueGeneric(template, instances, (e) => e.expense_date);
}

export function isIncomeDue(template: Income, instances: Income[]) {
  return isDueGeneric(template, instances, (i) => i.income_date);
}
