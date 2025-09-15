// lib/useMoneyApi.ts
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  addExpense as apiAddExpense,
  addIncome as apiAddIncome,
  getExpenses,
  getIncomes,
  getSummary,
  ExpenseDTO,
  IncomeDTO,
  SummaryDTO,
  toIsoDate,
} from "./api"

type MonthData = {
  incomes: IncomeDTO[]
  expenses: ExpenseDTO[]
  summary: SummaryDTO | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  addIncome: (p: {
    amount: number
    source: string
    date: Date
  }) => Promise<void>
  addExpense: (p: {
    amount: number
    category: string
    description: string
    date: Date
  }) => Promise<void>
}

export function useMonthData(year: number, month: number): MonthData {
  const [incomes, setIncomes] = useState<IncomeDTO[]>([])
  const [expenses, setExpenses] = useState<ExpenseDTO[]>([])
  const [summary, setSummary] = useState<SummaryDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [i, e, s] = await Promise.all([
        getIncomes(year, month),
        getExpenses(year, month),
        getSummary(year, month),
      ])
      setIncomes(i.items)
      setExpenses(e.items)
      setSummary(s)
    } catch (err: any) {
      setError(err?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    load()
  }, [load])

  const addIncome = useCallback(
    async ({
      amount,
      source,
      date,
    }: {
      amount: number
      source: string
      date: Date
    }) => {
      await apiAddIncome({ amount, source, date: toIsoDate(date) })
      await load()
    },
    [load]
  )

  const addExpense = useCallback(
    async ({
      amount,
      category,
      description,
      date,
    }: {
      amount: number
      category: string
      description: string
      date: Date
    }) => {
      await apiAddExpense({
        amount,
        category,
        description,
        date: toIsoDate(date),
      })
      await load()
    },
    [load]
  )

  return {
    incomes,
    expenses,
    summary,
    loading,
    error,
    refresh: load,
    addIncome,
    addExpense,
  }
}

// Optional helpers for client-side totals if you still need them

export function useTotals(incomes: IncomeDTO[], expenses: ExpenseDTO[]) {
  const totalIncome = useMemo(
    () => incomes.reduce((sum, i) => sum + i.amount, 0),
    [incomes]
  )
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  )
  const balance = totalIncome - totalExpenses
  const spentPct = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0

  // By category (for pie)
  const expensesByCategory = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const e of expenses)
      acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, [expenses])

  return { totalIncome, totalExpenses, balance, spentPct, expensesByCategory }
}
