"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Button,
  Card,
  Group,
  NumberInput,
  SegmentedControl,
  Text,
  TextInput,
  Title,
  Divider,
  Badge,
  Loader,
  Stack,
  Container,
  Paper,
  Progress,
} from "@mantine/core"
import { DateInput } from "@mantine/dates"
import dayjs from "dayjs"

type TxType = "Income" | "Expense"

type Tx = {
  id: number
  occurredOn: string // ISO
  type: TxType
  amount: number
  description?: string | null
}

type Summary = {
  income: number
  expense: number
  balance: number
  spentPercent: number
}

const API = process.env.NEXT_PUBLIC_API_BASE_URL // e.g. http://localhost:5179

export default function Page() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<Tx[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)

  const [formType, setFormType] = useState<TxType>("Expense")
  const [formDate, setFormDate] = useState<Date | null>(new Date())
  const [formAmount, setFormAmount] = useState<number | "">("")
  const [formDesc, setFormDesc] = useState("")

  const monthLabel = `${year}-${String(month).padStart(2, "0")}`

  async function fetchData() {
    setLoading(true)
    const [txRes, sumRes] = await Promise.all([
      fetch(`${API}/api/tx?year=${year}&month=${month}`),
      fetch(`${API}/api/tx/summary?year=${year}&month=${month}`),
    ])
    const tx = await txRes.json()
    const sum = await sumRes.json()
    setList(tx.items ?? [])
    setSummary(sum)
    setLoading(false)
  }

  useEffect(() => {
    fetchData() /* eslint-disable-next-line */
  }, [year, month])

  async function addTx() {
    if (!formDate || typeof formAmount !== "number" || formAmount <= 0) return
    const body = {
      occurredOn: dayjs(formDate).format("YYYY-MM-DD"),
      type: formType,
      amount: formAmount,
      description: formDesc || null,
    }
    const res = await fetch(`${API}/api/tx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setFormAmount("")
      setFormDesc("")
      // refetch
      fetchData()
    } else {
      alert("Failed to save")
    }
  }

  const totalExpense = useMemo(
    () =>
      list
        .filter((l) => l.type === "Expense")
        .reduce((a, b) => a + b.amount, 0),
    [list]
  )

  function changeMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth() + 1)
  }

  return (
    <Container size="sm" className="py-6">
      <Title order={2} className="mb-4">
        Money Tracker
      </Title>

      <Card withBorder shadow="sm" className="mb-4">
        {summary ? (
          <Stack gap="xs">
            <Group justify="space-between">
              <Text fw={600}>Balance</Text>
              <Title order={3}>{summary.balance.toFixed(2)}</Title>
            </Group>

            <Group justify="space-between">
              <Text>Income</Text>
              <Text fw={600}>{summary.income.toFixed(2)}</Text>
            </Group>

            <Group justify="space-between">
              <Text>Expense</Text>
              <Text fw={600}>{summary.expense.toFixed(2)}</Text>
            </Group>

            <Text size="sm">Spent {summary.spentPercent.toFixed(0)}%</Text>
            <Progress
              value={Math.max(0, Math.min(100, summary.spentPercent))}
            />
          </Stack>
        ) : (
          <Loader />
        )}
      </Card>

      <Card withBorder shadow="sm" className="mb-4">
        <Title order={4} className="mb-2">
          Add transaction
        </Title>
        <Stack>
          <SegmentedControl
            value={formType}
            onChange={(v) => setFormType(v as TxType)}
            data={[
              { label: "Expense", value: "Expense" },
              { label: "Income", value: "Income" },
            ]}
          />
          <DateInput
            label="Date"
            value={formDate}
            onChange={(value) => setFormDate(value ? new Date(value) : null)}
          />
          <NumberInput
            label="Amount"
            value={formAmount}
            onChange={(value) =>
              setFormAmount(value === "" ? "" : Number(value))
            }
            thousandSeparator
            decimalScale={2}
            placeholder="e.g. 25.50"
          />
          <TextInput
            label="Description (optional)"
            value={formDesc}
            onChange={(e) => setFormDesc(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button
              onClick={addTx}
              disabled={
                !(formDate && typeof formAmount === "number" && formAmount > 0)
              }
            >
              Add
            </Button>
          </Group>
        </Stack>
      </Card>

      <Group justify="space-between" className="mb-2">
        <Button variant="light" onClick={() => changeMonth(-1)}>
          ◀ prev
        </Button>
        <Text fw={600}>{monthLabel}</Text>
        <Button variant="light" onClick={() => changeMonth(1)}>
          next ▶
        </Button>
      </Group>

      <Paper withBorder p="sm">
        <Group justify="space-between" className="mb-2">
          <Text fw={600}>This month</Text>
          {loading && <Loader size="sm" />}
        </Group>
        <Divider className="mb-2" />
        <Stack gap="xs">
          {list.map((t) => {
            const pct =
              t.type === "Expense" && totalExpense > 0
                ? Math.round((t.amount / totalExpense) * 100)
                : 0
            return (
              <Group key={t.id} justify="space-between">
                <div>
                  <Text fw={500}>
                    {t.type} — {t.amount.toFixed(2)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t.occurredOn?.slice(0, 10)}
                    {t.description ? ` • ${t.description}` : ""}
                  </Text>
                </div>
                {t.type === "Expense" && pct > 0 && <Badge>{pct}%</Badge>}
              </Group>
            )
          })}
          {list.length === 0 && (
            <Text size="sm" c="dimmed">
              No transactions yet
            </Text>
          )}
        </Stack>
      </Paper>
    </Container>
  )
}
