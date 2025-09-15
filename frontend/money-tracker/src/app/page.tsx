"use client"

import React, { useMemo, useState } from "react"
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Modal,
  NumberInput,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  rem,
  Loader,
} from "@mantine/core"
import { PieChart } from "@mantine/charts"
import {
  IconPlus,
  IconTrendingUp,
  IconTrendingDown,
  IconWallet,
  IconCurrencyDollar,
} from "@tabler/icons-react"
import { Center } from "@mantine/core"

import { useMonthData, useTotals } from "./lib/useMoneyApi"

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: string
  color?: string
  icon?: React.ReactNode
}) {
  return (
    <Card withBorder radius="lg" padding="md">
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed" fw={500}>
          {label}
        </Text>
        <Box c={color}>{icon}</Box>
      </Group>
      <Text fw={700} size="xl" c={color}>
        {value}
      </Text>
    </Card>
  )
}

export default function ExpenseTrackerMantine() {
  // --- Month controls
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const monthLabel = `${year}-${String(month).padStart(2, "0")}`

  // --- Server data + actions
  const { incomes, expenses, summary, loading, error, addIncome, addExpense } =
    useMonthData(year, month)

  // --- Local UI state
  const [incomeOpen, setIncomeOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)

  const SLICE_COLORS = [
    "teal.6",
    "blue.6",
    "grape.6",
    "orange.6",
    "red.6",
    "cyan.6",
  ]

  // --- Client-side totals (fallback while summary loads)
  const { totalIncome, totalExpenses, balance, spentPct, expensesByCategory } =
    useTotals(incomes, expenses)

  // Prefer server summary if available
  const kpiIncome = summary ? summary.totalIncome : totalIncome
  const kpiExpense = summary ? summary.totalExpenses : totalExpenses
  const kpiBalance = summary ? summary.remainingBalance : balance
  const kpiSpentPct = summary ? summary.spentPercentage : spentPct

  // Pie data: prefer server breakdown, otherwise compute locally
  const breakdown = summary?.categoryBreakdown?.length
    ? summary.categoryBreakdown
    : Object.entries(expensesByCategory).map(([category, amount]) => ({
        category,
        amount,
      }))

  function changeMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth() + 1)
  }

  return (
    <Container size="lg" py="md">
      {/* Header */}
      <Stack gap="xs" align="center" mb="md">
        <Title order={1}>Expense Tracker</Title>
        <Text c="dimmed" ta="center">
          Track your income and expenses to stay on top of your finances
        </Text>
        {error && (
          <Text c="red" size="sm">
            Error: {error}
          </Text>
        )}
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <StatCard
          label="Total Income"
          value={`$${kpiIncome.toLocaleString()}`}
          color="teal"
          icon={<IconTrendingUp size={18} />}
        />
        <StatCard
          label="Total Expenses"
          value={`$${kpiExpense.toLocaleString()}`}
          color="red"
          icon={<IconTrendingDown size={18} />}
        />
        <StatCard
          label="Remaining Balance"
          value={`$${kpiBalance.toLocaleString()}`}
          color={kpiBalance >= 0 ? "teal" : "red"}
          icon={<IconWallet size={18} />}
        />
        <Card withBorder radius="lg" padding="md">
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed" fw={500}>
              Spent Percentage
            </Text>
            <IconCurrencyDollar size={18} />
          </Group>
          <Text fw={700} size="xl">
            {kpiSpentPct.toFixed(1)}%
          </Text>
          <Progress
            value={Math.max(0, Math.min(100, kpiSpentPct))}
            mt="xs"
            radius="xl"
            aria-label="spent"
          />
        </Card>
      </SimpleGrid>

      {/* Spending overview */}
      <Card withBorder radius="lg" mt="md">
        <Group justify="space-between" p="md" pb={0}>
          <Text fw={600}>Spending Overview</Text>
          <Group gap="xs">
            <Button variant="light" onClick={() => changeMonth(-1)}>
              ◀ prev
            </Button>
            <Text fw={600}>{monthLabel}</Text>
            <Button variant="light" onClick={() => changeMonth(1)}>
              next ▶
            </Button>
          </Group>
        </Group>
        <Box p="md">
          {loading && breakdown.length === 0 ? (
            <Center>
              <Loader />
            </Center>
          ) : breakdown.length === 0 ? (
            <Text c="dimmed" ta="center" py="lg">
              No expenses yet — add one to see the chart
            </Text>
          ) : (
            <Center>
              <PieChart
                data={breakdown.map((c, i) => ({
                  name: c.category,
                  value: c.amount,
                  color: SLICE_COLORS[i % SLICE_COLORS.length],
                }))}
                withLabels
                labelsPosition="inside"
                size={260}
                tooltipDataSource="segment"
                labelsType="percent"
              />
            </Center>
          )}
        </Box>
      </Card>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mt="md">
        {/* Income */}
        <Card withBorder radius="lg">
          <Group justify="space-between" p="md" pb={0}>
            <Text fw={600}>Income Sources</Text>
            <Button
              leftSection={<IconPlus size={16} />}
              size="compact-sm"
              onClick={() => setIncomeOpen(true)}
            >
              Add Income
            </Button>
          </Group>
          <Box p="md">
            {incomes.length === 0 ? (
              <Text c="dimmed" ta="center" py="md">
                {loading ? "Loading…" : "No income sources added yet"}
              </Text>
            ) : (
              <Stack gap="sm">
                {incomes.map((i) => (
                  <Group
                    key={i.id}
                    justify="space-between"
                    p="sm"
                    style={{
                      border: "1px solid var(--mantine-color-gray-3)",
                      borderRadius: rem(8),
                    }}
                  >
                    <div>
                      <Text fw={500}>{i.source}</Text>
                      <Text size="sm" c="dimmed">
                        {i.date}
                      </Text>
                    </div>
                    <Badge color="teal" variant="light">
                      +${i.amount.toLocaleString()}
                    </Badge>
                  </Group>
                ))}
              </Stack>
            )}
          </Box>
        </Card>

        {/* Expenses */}
        <Card withBorder radius="lg">
          <Group justify="space-between" p="md" pb={0}>
            <Text fw={600}>Recent Expenses</Text>
            <Button
              leftSection={<IconPlus size={16} />}
              size="compact-sm"
              onClick={() => setExpenseOpen(true)}
            >
              Add Expense
            </Button>
          </Group>
          <Box p="md">
            {expenses.length === 0 ? (
              <Text c="dimmed" ta="center" py="md">
                {loading ? "Loading…" : "No expenses recorded yet"}
              </Text>
            ) : (
              <Stack gap="sm">
                {expenses
                  .slice(-5)
                  .reverse()
                  .map((e) => (
                    <Group
                      key={e.id}
                      justify="space-between"
                      p="sm"
                      style={{
                        border: "1px solid var(--mantine-color-gray-3)",
                        borderRadius: rem(8),
                      }}
                    >
                      <div>
                        <Text fw={500}>{e.description}</Text>
                        <Text size="sm" c="dimmed">
                          {e.category} • {e.date}
                        </Text>
                      </div>
                      <Badge color="red" variant="light">
                        -${e.amount.toLocaleString()}
                      </Badge>
                    </Group>
                  ))}
              </Stack>
            )}
          </Box>
        </Card>
      </SimpleGrid>

      {/* Add Income Modal */}
      <AddIncomeModal
        opened={incomeOpen}
        onClose={() => setIncomeOpen(false)}
        onSubmit={async (data) => {
          // Convert string date -> Date (expects ISO "YYYY-MM-DD" or similar)
          const parsed = new Date(data.date)
          await addIncome({
            amount: data.amount,
            source: data.source,
            date: parsed,
          })
          setIncomeOpen(false)
        }}
      />
      {/* Add Expense Modal */}
      <AddExpenseModal
        opened={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        onSubmit={async (data) => {
          const parsed = new Date(data.date)
          await addExpense({
            amount: data.amount,
            category: data.category,
            description: data.description,
            date: parsed,
          })
          setExpenseOpen(false)
        }}
      />
    </Container>
  )
}

/*** Dialogs ***/
type IncomeForm = { amount: number; source: string; date: string }
type ExpenseForm = {
  amount: number
  category: string
  description: string
  date: string
}

function AddIncomeModal({
  opened,
  onClose,
  onSubmit,
}: {
  opened: boolean
  onClose: () => void
  onSubmit: (income: IncomeForm) => void
}) {
  const [amount, setAmount] = useState<number | string>("")
  const [source, setSource] = useState("")
  // Use ISO by default to avoid locale parsing issues
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  )

  const canSubmit =
    amount !== "" && Number(amount) > 0 && source.trim().length > 0

  return (
    <Modal opened={opened} onClose={onClose} title="Add income" radius="lg">
      <Stack>
        <NumberInput
          label="Amount"
          value={amount}
          prefix="$ "
          thousandSeparator
          onChange={setAmount}
          min={0}
          hideControls
        />
        <TextInput
          label="Source"
          placeholder="Salary, gift, side job…"
          value={source}
          onChange={(e) => setSource(e.currentTarget.value)}
        />
        <TextInput
          label="Date (YYYY-MM-DD)"
          value={date}
          onChange={(e) => setDate(e.currentTarget.value)}
        />
        <Group justify="space-between" mt="xs">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() =>
              canSubmit && onSubmit({ amount: Number(amount), source, date })
            }
            disabled={!canSubmit}
          >
            Add income
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

function AddExpenseModal({
  opened,
  onClose,
  onSubmit,
}: {
  opened: boolean
  onClose: () => void
  onSubmit: (expense: ExpenseForm) => void
}) {
  const [amount, setAmount] = useState<number | string>("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  )

  const canSubmit =
    amount !== "" &&
    Number(amount) > 0 &&
    category.trim().length > 0 &&
    description.trim().length > 0

  return (
    <Modal opened={opened} onClose={onClose} title="Add expense" radius="lg">
      <Stack>
        <NumberInput
          label="Amount"
          value={amount}
          prefix="$ "
          thousandSeparator
          onChange={setAmount}
          min={0}
          hideControls
        />
        <TextInput
          label="Category"
          placeholder="Transportation, Shopping, …"
          value={category}
          onChange={(e) => setCategory(e.currentTarget.value)}
        />
        <TextInput
          label="Description"
          placeholder="Groceries, Uber, movie night…"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
        />
        <TextInput
          label="Date (YYYY-MM-DD)"
          value={date}
          onChange={(e) => setDate(e.currentTarget.value)}
        />
        <Group justify="space-between" mt="xs">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() =>
              canSubmit &&
              onSubmit({ amount: Number(amount), category, description, date })
            }
            disabled={!canSubmit}
          >
            Add expense
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
