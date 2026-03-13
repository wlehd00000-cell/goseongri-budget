import type { Expense, BudgetConfig } from '@/lib/supabase'
import type { Stats } from '@/types/stats'
import {
  TOTAL_BUDGET, HEADCOUNT, PROJECT_START, PROJECT_END,
  SEGMENTS, TEAMS, CATEGORIES, daysBetween, todayStr
} from './constants'

export function computeStats(expenses: Expense[], budgetConfig: BudgetConfig): Stats {
  const reserve = budgetConfig.reserve
  const operating = TOTAL_BUDGET - reserve

  const actual = expenses.filter(e => e.status === '실제').reduce((s, e) => s + e.amount, 0)
  const planned = expenses.filter(e => e.status === '예정').reduce((s, e) => s + e.amount, 0)
  const total = actual + planned
  const remaining = operating - total

  const reimbursements = expenses.filter(e => e.reimburse)
  const reimbPending = reimbursements.filter(e => !e.reimbursed)
  const reimbDone = reimbursements.filter(e => e.reimbursed)
  const reimbPendingTotal = reimbPending.reduce((s, e) => s + e.amount, 0)
  const reimbDoneTotal = reimbDone.reduce((s, e) => s + e.amount, 0)
  const reimbByPerson: Record<string, { amount: number; count: number }> = {}
  reimbPending.forEach(e => {
    const name = e.paid_by || '미지정'
    if (!reimbByPerson[name]) reimbByPerson[name] = { amount: 0, count: 0 }
    reimbByPerson[name].amount += e.amount
    reimbByPerson[name].count++
  })

  const totalDays = daysBetween(PROJECT_START, PROJECT_END)
  const elapsed = Math.max(0, Math.min(totalDays, daysBetween(PROJECT_START, todayStr())))
  const remainDays = totalDays - elapsed
  const dailyBurn = elapsed > 0 ? actual / elapsed : 0
  const projectedTotal = dailyBurn * totalDays
  const perCapitaDaily = elapsed > 0 ? actual / elapsed / HEADCOUNT : 0

  // 현재 구간 감지
  const t = todayStr()
  let currentPhase = null as Stats['currentPhase'] | null
  for (const [k, seg] of Object.entries(SEGMENTS)) {
    if (t >= seg.start && t <= seg.end) {
      const segDays = daysBetween(seg.start, seg.end)
      const segElapsed = daysBetween(seg.start, t)
      currentPhase = { key: k, label: seg.label, icon: seg.icon, segDays, segElapsed, pct: ((segElapsed / segDays) * 100).toFixed(0) }
      break
    }
  }
  if (!currentPhase) {
    const upcoming = Object.entries(SEGMENTS).find(([, seg]) => t < seg.start)
    if (upcoming) {
      const daysUntil = daysBetween(t, upcoming[1].start)
      currentPhase = { key: upcoming[0], label: upcoming[1].label, icon: upcoming[1].icon, segDays: daysBetween(upcoming[1].start, upcoming[1].end), segElapsed: 0, pct: '0', upcoming: true, daysUntil }
    } else {
      currentPhase = { key: 'done', label: '프로젝트 종료', icon: '✅', segDays: 0, segElapsed: 0, pct: '100' }
    }
  }

  const bySegment: Stats['bySegment'] = {}
  for (const k of Object.keys(SEGMENTS)) {
    const seg = SEGMENTS[k]
    const segBudget = (budgetConfig as unknown as Record<string, number>)[k] || 0
    const items = expenses.filter(e => e.segment === k)
    const sActual = items.filter(e => e.status === '실제').reduce((s, e) => s + e.amount, 0)
    const sPlanned = items.filter(e => e.status === '예정').reduce((s, e) => s + e.amount, 0)
    const segDays = daysBetween(seg.start, seg.end)
    const segElapsed = Math.max(0, Math.min(segDays, daysBetween(seg.start, t)))
    const segBurn = segElapsed > 0 ? sActual / segElapsed : 0
    bySegment[k] = { actual: sActual, planned: sPlanned, total: sActual + sPlanned, budget: segBudget, segDays, segElapsed, segBurn, projected: segBurn * segDays }
  }

  const byTeam: Stats['byTeam'] = {}
  for (const team of TEAMS) {
    const items = expenses.filter(e => e.team === team)
    byTeam[team] = {
      actual: items.filter(e => e.status === '실제').reduce((s, e) => s + e.amount, 0),
      planned: items.filter(e => e.status === '예정').reduce((s, e) => s + e.amount, 0),
      total: items.reduce((s, e) => s + e.amount, 0),
    }
  }

  const byCategory: Stats['byCategory'] = {}
  for (const cat of CATEGORIES) {
    const items = expenses.filter(e => e.category === cat)
    byCategory[cat] = {
      actual: items.filter(e => e.status === '실제').reduce((s, e) => s + e.amount, 0),
      planned: items.filter(e => e.status === '예정').reduce((s, e) => s + e.amount, 0),
      total: items.reduce((s, e) => s + e.amount, 0),
    }
  }

  const sorted = [...expenses].filter(e => e.status === '실제').sort((a, b) => a.date.localeCompare(b.date))
  let cum = 0
  const dailyCum = sorted.map(e => { cum += e.amount; return { date: e.date.slice(5), amount: cum } })

  const dateMap: Record<string, { date: string; actual: number; planned: number; total: number; count: number; items: Expense[] }> = {}
  expenses.forEach(e => {
    if (!dateMap[e.date]) dateMap[e.date] = { date: e.date, actual: 0, planned: 0, total: 0, count: 0, items: [] }
    const d = dateMap[e.date]
    d.count++
    d.total += e.amount
    if (e.status === '실제') d.actual += e.amount
    else d.planned += e.amount
    d.items.push(e)
  })
  const byDate = Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date))
  const dailyBarData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
    date: d.date.slice(5),
    fullDate: d.date,
    실제: d.actual,
    예정: d.planned,
  }))

  const teamBarData = TEAMS.map(t => ({ name: t, 실제: byTeam[t].actual, 예정: byTeam[t].planned }))
  const catBarData = CATEGORIES.filter(c => byCategory[c].total > 0).map(c => ({ name: c, 실제: byCategory[c].actual, 예정: byCategory[c].planned }))

  return {
    actual, planned, total, remaining, reserve, operating,
    totalDays, elapsed, remainDays, dailyBurn, projectedTotal, perCapitaDaily,
    currentPhase,
    bySegment, byTeam, byCategory,
    dailyCum, byDate, dailyBarData, teamBarData, catBarData,
    reimbPendingTotal, reimbDoneTotal, reimbByPerson,
    reimbPendingCount: reimbPending.length,
    reimbDoneCount: reimbDone.length,
  }
}
