'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import type { MonthlyRevenuePoint } from '@/app/actions/dashboard'

interface RevenueChartProps {
  data: MonthlyRevenuePoint[]
}

function formatMAD(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}k`
  return value.toString()
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; payload: MonthlyRevenuePoint }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const { revenue, count } = payload[0].payload
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-foreground">{revenue.toLocaleString('fr-FR')} MAD</p>
      <p className="text-muted-foreground">{count} inscription{count !== 1 ? 's' : ''}</p>
    </div>
  )
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const hasData = data.some(d => d.revenue > 0)

  if (!hasData) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Aucune donnée de CA disponible pour cette période.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatMAD}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', radius: 4 }} />
        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  )
}
