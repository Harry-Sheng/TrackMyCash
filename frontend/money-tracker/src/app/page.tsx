"use client"

import React, { useMemo, useState } from "react"
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Modal,
  NumberInput,
  Progress,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  rem,
} from "@mantine/core"
import { PieChart } from "@mantine/charts"
import {
  IconPlus,
  IconTrendingUp,
  IconTrendingDown,
  IconWallet,
  IconCurrencyDollar,
} from "@tabler/icons-react"

interface Income {
  id: string
  amount: number
  source: string
  date: string
}

interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
}

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
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomeOpen, setIncomeOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)

  const totalIncome = useMemo(
    () => incomes.reduce((sum, i) => sum + i.amount, 0),
    [incomes]
  )
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  )
  const remainingBalance = totalIncome - totalExpenses
  const spentPercentage =
    totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0

  // --- Group by category
  const expensesByCategory = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const e of expenses)
      acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, [expenses])

  const categoryPercentages = useMemo(
    () =>
      Object.entries(expensesByCategory).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
      })),
    [expensesByCategory, totalIncome]
  )

  const addIncome = (income: Omit<Income, "id">) => {
    setIncomes((prev) => [...prev, { ...income, id: Date.now().toString() }])
  }

  const addExpense = (expense: Omit<Expense, "id">) => {
    setExpenses((prev) => [...prev, { ...expense, id: Date.now().toString() }])
  }

  return (
    <Container size="lg" py="md">
      {/* Header */}
      <Stack gap="xs" align="center" mb="md">
        <Title order={1}>Expense Tracker</Title>
        <Text c="dimmed" ta="center">
          Track your income and expenses to stay on top of your finances
        </Text>
      </Stack>

      {/* Summary */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <StatCard
          label="Total Income"
          value={`$${totalIncome.toLocaleString()}`}
          color="teal"
          icon={<IconTrendingUp size={18} />}
        />
        <StatCard
          label="Total Expenses"
          value={`$${totalExpenses.toLocaleString()}`}
          color="red"
          icon={<IconTrendingDown size={18} />}
        />
        <StatCard
          label="Remaining Balance"
          value={`$${remainingBalance.toLocaleString()}`}
          color={remainingBalance >= 0 ? "teal" : "red"}
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
            {spentPercentage.toFixed(1)}%
          </Text>
          <Progress
            value={spentPercentage}
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
        </Group>
        <Box p="md">
          {categoryPercentages.length === 0 ? (
            <Text c="dimmed" ta="center" py="lg">
              No expenses yet — add one to see the chart
            </Text>
          ) : (
            <PieChart
              data={categoryPercentages.map((c) => ({
                name: c.category,
                value: c.amount,
              }))}
              withLabels
              labelsPosition="outside"
              size={240}
              tooltipDataSource="segment"
            />
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
                No income sources added yet
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
                No expenses recorded yet
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
        onSubmit={(data) => {
          addIncome(data)
          setIncomeOpen(false)
        }}
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        opened={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        onSubmit={(data) => {
          addExpense(data)
          setExpenseOpen(false)
        }}
      />
    </Container>
  )
}

/*** Dialogs ***/
function AddIncomeModal({
  opened,
  onClose,
  onSubmit,
}: {
  opened: boolean
  onClose: () => void
  onSubmit: (income: Omit<Income, "id">) => void
}) {
  const [amount, setAmount] = useState<number | string>("")
  const [source, setSource] = useState("")
  const [date, setDate] = useState<string>(new Date().toLocaleDateString())

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
          label="Date"
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
  onSubmit: (expense: Omit<Expense, "id">) => void
}) {
  const [amount, setAmount] = useState<number | string>("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<string>(new Date().toLocaleDateString())

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
          label="Date"
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
