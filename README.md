# Ledger — Expense & Income Tracker

A Next.js 14 (App Router + TypeScript) personal finance tracker with Supabase auth (Google login). Styled as a distinct "premium ledger" design system (ivory/navy + bronze-gold palette, serif+sans type pairing, an always-dark sidebar) rather than a default component-library look.

## Features

- Google sign-in via Supabase Auth — all data is scoped to the signed-in user's ID with row-level security
- **Dashboard**: monthly spend, monthly savings, top category, recurring count, 6-month income-vs-expense chart, category breakdown
- **Income**: log salary or any other income, one-off or recurring (weekly/monthly/yearly) — mark your salary as recurring and it'll show up for one-click generation each period
- **Expenses**: add/edit/delete, search, filter by category and date range, CSV export, receipt photo upload
- **Trends**: 12-month income/expense/savings chart, savings rate, all-time net savings, month-over-month and year-over-year comparison cards, and a custom date-range A-vs-B comparator
- **Categories**: custom categories with color + emoji icon
- **Budgets**: monthly limit per category (or overall), with progress bars and over-budget warnings
- **Recurring**: one place to see every recurring expense and income template and generate what's due this period
- **Settings**: default currency, sign out
- Dark mode

## 1. Install

```bash
npm install
npm run dev
```

`.env.local` already has your Supabase URL and publishable key filled in.

## 2. Set up the database

Open your Supabase project → **SQL Editor** → paste in `supabase/schema.sql` → run it.

This creates `profiles`, `categories`, `expenses`, `budgets`, `income`, row-level security policies, a trigger that seeds 10 default categories for every new user, and a public `receipts` storage bucket.

> Already ran an older version of this schema? Just add the new table by running the `income` block from `supabase/schema.sql` (or the whole file again — everything uses `create table if not exists` / `drop policy if exists`, so it's safe to re-run).

## 3. Enable Google sign-in in Supabase

Supabase Dashboard → **Authentication → Providers → Google**:

1. Create an OAuth 2.0 Client ID (Web application) in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add this **Authorized redirect URI** to that Google OAuth client: `https://uafmfvcvmigqkurdiket.supabase.co/auth/v1/callback`.
3. Paste the Client ID and Client Secret into Supabase's Google provider settings, and enable the provider.

Only standard sign-in scopes (email/profile) are requested, so there's no "unverified app" warning or Google review needed.

## 4. Redirect URLs

Supabase Dashboard → **Authentication → URL Configuration** → add:
- `http://localhost:3000/auth/callback` for local dev
- your production URL + `/auth/callback`, once deployed

## Notes

- "Savings" = income minus expenses for a period. The Trends page is where all the comparison/analysis lives.
- Recurring works the same way for both Income and Expenses: the original entry is the "template" (`is_recurring = true`); the Recurring tab generates that period's copy, linked back via `parent_recurring_id`.
- Receipts are stored in the `receipts` Supabase Storage bucket (public bucket, one folder per user, path-scoped by RLS).
- All data access uses the Supabase anon/publishable key, protected by row-level security — no service role key is used or needed.
