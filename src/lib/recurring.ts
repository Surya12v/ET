import type { Expense, RecurrenceInterval } from "./types";

function periodKey(date: Date, interval: RecurrenceInterval) {
  if (interval === "yearly") return `${date.getFullYear()}`;
  if (interval === "weekly") {
    const first = new Date(date.getFullYear(), 0, 1);
    const week = Math.ceil(((date.getTime() - first.getTime()) / 86400000 + first.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${week}`;
  }
  return `${date.getFullYear()}-${date.getMonth()}`;
}

// Returns true if `template` is still due to be generated for the current
// period (this month / week / year), based on its own date plus any
// already-generated instances.
export function isDueThisPeriod(template: Expense, instances: Expense[]) {
  if (!template.recurrence_interval) return false;
  const now = new Date();
  const currentKey = periodKey(now, template.recurrence_interval);
  const templateKey = periodKey(new Date(template.expense_date), template.recurrence_interval);
  if (templateKey === currentKey) return false; // the template itself already counts for this period
  return !instances.some(
    (i) => i.parent_recurring_id === template.id && periodKey(new Date(i.expense_date), template.recurrence_interval!) === currentKey
  );
}
