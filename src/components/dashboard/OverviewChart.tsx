"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const data = [
  { name: "Jan", income: 4000, expense: 2400 },
  { name: "Feb", income: 3000, expense: 1398 },
  { name: "Mar", income: 5000, expense: 3800 },
  { name: "Apr", income: 2780, expense: 1908 },
  { name: "May", income: 1890, expense: 800 },
  { name: "Jun", income: 2390, expense: 1800 },
  { name: "Jul", income: 3490, expense: 2300 },
  { name: "Aug", income: 3490, expense: 2300 },
  { name: "Sep", income: 2390, expense: 1800 },
  { name: "Oct", income: 1890, expense: 800 },
  { name: "Nov", income: 2780, expense: 1908 },
  { name: "Dec", income: 5000, expense: 3800 },
]

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--primary))",
  },
  expense: {
    label: "Expense",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig

export function OverviewChart() {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>Monthly income vs. expenses.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: "hsl(var(--muted))" }}
              />
              <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}