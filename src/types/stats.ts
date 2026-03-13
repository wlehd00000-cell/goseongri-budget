import type { Expense } from '@/lib/supabase'

export type DailyEntry = {
  date: string
  actual: number
  planned: number
  total: number
  count: number
  items: Expense[]
}

export type SegmentStats = {
  actual: number
  planned: number
  total: number
  budget: number
  segDays: number
  segElapsed: number
  segBurn: number
  projected: number
}

export type PhaseInfo = {
  key: string
  label: string
  icon: string
  segDays: number
  segElapsed: number
  pct: string
  upcoming?: boolean
  daysUntil?: number
}

export type Stats = {
  actual: number
  planned: number
  total: number
  remaining: number
  reserve: number
  operating: number
  totalDays: number
  elapsed: number
  remainDays: number
  dailyBurn: number
  projectedTotal: number
  perCapitaDaily: number
  currentPhase: PhaseInfo
  bySegment: Record<string, SegmentStats>
  byTeam: Record<string, { actual: number; planned: number; total: number }>
  byCategory: Record<string, { actual: number; planned: number; total: number }>
  dailyCum: { date: string; amount: number }[]
  byDate: DailyEntry[]
  dailyBarData: { date: string; fullDate: string; 실제: number; 예정: number }[]
  teamBarData: { name: string; 실제: number; 예정: number }[]
  catBarData: { name: string; 실제: number; 예정: number }[]
  reimbPendingTotal: number
  reimbDoneTotal: number
  reimbByPerson: Record<string, { amount: number; count: number }>
  reimbPendingCount: number
  reimbDoneCount: number
}
