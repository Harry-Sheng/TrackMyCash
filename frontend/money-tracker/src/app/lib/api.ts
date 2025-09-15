// lib/api.ts
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5015"

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`HTTP ${res.status} – ${text || res.statusText}`)
  }
  return res.json() as Promise<T>
}

export function toIsoDate(d: Date) {
  // Always send YYYY-MM-DD to the API
  return d.toISOString().slice(0, 10)
}

export type IncomeDTO = {
  id: string
  amount: number
  source: string
  date: string // YYYY-MM-DD
}

export type ExpenseDTO = {
  id: string
  amount: number
  category: string
  description: string
  date: string // YYYY-MM-DD
}

export type ListResult<T> = { items: T[] }

export type SummaryDTO = {
  totalIncome: number
  totalExpenses: number
  remainingBalance: number
  spentPercentage: number
  categoryBreakdown: { category: string; amount: number }[]
}

// --- API calls ---

export function getIncomes(year: number, month: number) {
  return fetchJson<ListResult<IncomeDTO>>(
    `/api/incomes?year=${year}&month=${month}`
  )
}
export function getExpenses(year: number, month: number) {
  return fetchJson<ListResult<ExpenseDTO>>(
    `/api/expenses?year=${year}&month=${month}`
  )
}
export function getSummary(year: number, month: number) {
  return fetchJson<SummaryDTO>(`/api/summary?year=${year}&month=${month}`)
}

export function addIncome(input: {
  amount: number
  source: string
  date: string
}) {
  return fetchJson<IncomeDTO>(`/api/incomes`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}
export function addExpense(input: {
  amount: number
  category: string
  description: string
  date: string
}) {
  return fetchJson<ExpenseDTO>(`/api/expenses`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}
