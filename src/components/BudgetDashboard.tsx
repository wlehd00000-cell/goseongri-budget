'use client'
import React, { useMemo, useCallback, useState } from 'react'
import { useSupabaseData } from '@/hooks/useSupabaseData'
import { computeStats } from '@/lib/computeStats'
import {
  APP_NAME, TOTAL_BUDGET, HEADCOUNT, SEGMENTS, SEG_COLORS,
  COLORS, fmt, fmtMan, todayStr, INITIAL_BUDGET_CONFIG
} from '@/lib/constants'
import OverviewTab from './OverviewTab'
import SegmentsTab from './SegmentsTab'
import ListTab from './ListTab'
import ReimburseTab from './ReimburseTab'
import type { Expense } from '@/lib/supabase'

export default function BudgetDashboard() {
  const {
    expenses, budgetConfig, loading, syncStatus, lastSync, newDataToast,
    addExpense, updateExpense, deleteExpense, updateBudgetConfig, resetAll,
  } = useSupabaseData()

  const [tab, setTab] = useState('overview')
  const [budgetSaving, setBudgetSaving] = useState(false)

  const stats = useMemo(() => {
    if (!expenses.length && !budgetConfig) return null
    if (!budgetConfig) return null
    return computeStats(expenses, budgetConfig)
  }, [expenses, budgetConfig])

  const handleUpdateBudget = useCallback(async (updates: Parameters<typeof updateBudgetConfig>[0]) => {
    setBudgetSaving(true)
    try {
      await updateBudgetConfig(updates)
    } finally {
      setBudgetSaving(false)
    }
  }, [updateBudgetConfig])

  const exportCSV = useCallback(() => {
    if (!expenses || !stats || !budgetConfig) return
    const BOM = '\uFEFF'
    const header = '날짜,항목,팀,구간,구간배정예산,상태,금액,개인결제,결제자,정산완료,메모,등록일\n'
    const rows = expenses.map(e =>
      `${e.date},${e.category},${e.team},${SEGMENTS[e.segment].label},${(budgetConfig as Record<string, unknown>)[e.segment] ?? 0},${e.status},${e.amount},${e.reimburse ? 'Y' : 'N'},${e.paid_by || ''},${e.reimbursed ? 'Y' : 'N'},"${e.memo || ''}",${e.created_at?.slice(0, 10) || ''}`
    ).join('\n')
    const summary = `\n\n[요약]\n총예산,${TOTAL_BUDGET}\n예비비,${stats.reserve}\n가용예산,${stats.operating}\n실제지출,${stats.actual}\n예정지출,${stats.planned}\n잔액,${stats.remaining}\n번레이트(일),${Math.round(stats.dailyBurn)}\n1인1일평균,${Math.round(stats.perCapitaDaily)}\n\n[소급정산현황]\n미정산건수,${stats.reimbPendingCount}\n미정산금액,${stats.reimbPendingTotal}\n정산완료건수,${stats.reimbDoneCount}\n정산완료금액,${stats.reimbDoneTotal}`
    const blob = new Blob([BOM + header + rows + summary], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `사회혁신학기_예산_${todayStr()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [expenses, stats, budgetConfig])

  if (loading || !budgetConfig) {
    return (
      <div style={{ fontFamily: "'Pretendard Variable', -apple-system, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: COLORS.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 14, color: COLORS.textSec }}>데이터 불러오는 중...</div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={{ fontFamily: "'Pretendard Variable', -apple-system, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: COLORS.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 14, color: COLORS.textSec }}>데이터 연결 중...</div>
        </div>
      </div>
    )
  }

  // 경고
  const warnings: { level: string; msg: string }[] = []
  if (stats.remaining < 0) warnings.push({ level: 'error', msg: `가용 예산 ${fmt(Math.abs(stats.remaining))}원 초과! 즉시 지출 동결 필요.` })
  else if (stats.remaining < stats.operating * 0.1) warnings.push({ level: 'error', msg: `잔여 가용 예산 10% 미만 (${fmt(stats.remaining)}원). 긴급 절감 필요.` })
  if (stats.projectedTotal > stats.operating && stats.elapsed > 7) {
    warnings.push({ level: 'warn', msg: `현재 번레이트 일 ${fmt(stats.dailyBurn)}원 유지 시, 예상 총지출 ${fmt(stats.projectedTotal)}원 → 가용 예산 ${fmt(stats.projectedTotal - stats.operating)}원 초과 전망.` })
  }
  Object.entries(SEGMENTS).forEach(([k, seg]) => {
    const d = stats.bySegment[k]
    const bgt = d.budget
    if (d.total > bgt) warnings.push({ level: 'error', msg: `[${seg.label}] 배정(${fmt(bgt)}원) 대비 ${fmt(d.total - bgt)}원 초과!` })
    else if (bgt > 0 && d.total > bgt * 0.85) warnings.push({ level: 'warn', msg: `[${seg.label}] 집행률 ${((d.total / bgt) * 100).toFixed(0)}% → 잔액 ${fmt(bgt - d.total)}원` })
    if (d.projected > bgt && d.segElapsed > 3) warnings.push({ level: 'warn', msg: `[${seg.label}] 번레이트 기준 예상 집행 ${fmt(d.projected)}원 → 배정 초과 전망.` })
  })
  if (stats.reimbPendingTotal > 0) warnings.push({ level: 'warn', msg: `💳 개인 결제 미정산 ${stats.reimbPendingCount}건, 총 ${fmt(stats.reimbPendingTotal)}원 → 소급 처리 필요.` })

  // 동기화 표시
  const syncColor = newDataToast ? '#fbbf24' : syncStatus === 'synced' ? '#34d399' : syncStatus === 'saving' ? '#60a5fa' : '#f87171'
  const syncLabel = newDataToast
    ? '⚡ 새 데이터 반영됨'
    : syncStatus === 'saving' ? '저장 중...'
    : syncStatus === 'synced'
      ? `동기화 완료 · ${lastSync ? lastSync.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}`
      : syncStatus === 'error' ? '저장 실패'
      : '로컬 모드'

  const tabItems = [
    { key: 'overview', label: '총괄 현황', icon: '📊' },
    { key: 'segments', label: '구간별·예산', icon: '📍' },
    { key: 'list', label: '지출 내역', icon: '📋' },
    { key: 'reimburse', label: '소급정산', icon: '💳' },
  ]

  return (
    <div style={{ fontFamily: "'Pretendard Variable', -apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif", background: COLORS.bg, minHeight: '100vh', color: COLORS.text }}>
      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)', padding: '20px 16px 18px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: '#64748b', textTransform: 'uppercase' }}>
                Social Innovation Semester 2026
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 0', color: '#fff', letterSpacing: -0.5 }}>
                {APP_NAME} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>v3.1</span>
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 10, color: syncColor, display: 'flex', alignItems: 'center', gap: 5, transition: 'color 0.3s' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: syncColor, display: 'inline-block', boxShadow: newDataToast ? `0 0 0 3px ${syncColor}40` : 'none', transition: 'all 0.3s' }} />
                {syncLabel}
              </div>
              <button onClick={exportCSV} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#cbd5e1', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                📥 CSV
              </button>
              <button onClick={() => { if (confirm('모든 데이터를 초기 상태로 되돌리시겠습니까?')) resetAll() }}
                style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                ↺ 초기화
              </button>
            </div>
          </div>

          {/* KPI STRIP */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
            {[
              { label: '가용 예산', val: fmtMan(stats.operating) + '원', color: '#fff' },
              { label: '총 집행 (실제+예정)', val: fmtMan(stats.total) + '원', color: stats.total > stats.operating ? '#f87171' : '#34d399' },
              { label: '잔액', val: fmtMan(Math.max(stats.remaining, 0)) + '원', color: stats.remaining < stats.operating * 0.1 ? '#f87171' : '#a78bfa' },
            ].map((k, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{k.label}</div>
                <div className="kpi-val" style={{ fontSize: 18, fontWeight: 800, color: k.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* SEGMENT BUDGET BREAKDOWN */}
          <div className="resp-seg-grid" style={{ display: 'grid', gridTemplateColumns: 'auto repeat(3, 1fr)', gap: 6, marginTop: 8, alignItems: 'center' }}>
            <div style={{ padding: '6px 10px', borderRadius: 7, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <div style={{ fontSize: 9, color: '#fbbf24', fontWeight: 700 }}>🔒 예비비</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24' }}>{fmt(stats.reserve)}원</div>
            </div>
            {Object.entries(SEGMENTS).map(([k, seg]) => {
              const d = stats.bySegment[k]
              const pct = d.budget > 0 ? ((d.total / d.budget) * 100).toFixed(0) : 0
              return (
                <div key={k} style={{ padding: '6px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: `1px solid ${SEG_COLORS[k]}25`, minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: SEG_COLORS[k], fontWeight: 700, display: 'flex', justifyContent: 'space-between', overflow: 'hidden' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seg.icon} {seg.label}</span>
                    <span style={{ flexShrink: 0, marginLeft: 4 }}>{pct}%</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmt(d.budget)}<span style={{ fontSize: 9, color: '#64748b' }}>원</span></div>
                </div>
              )
            })}
          </div>

          {/* CURRENT PHASE INDICATOR */}
          <div style={{ marginTop: 8, padding: '8px 14px', borderRadius: 8, background: stats.currentPhase.upcoming ? 'rgba(255,255,255,0.03)' : `${SEG_COLORS[stats.currentPhase.key] || '#8b5cf6'}15`, border: `1px solid ${SEG_COLORS[stats.currentPhase.key] || '#8b5cf6'}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{stats.currentPhase.icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {stats.currentPhase.upcoming
                    ? `${stats.currentPhase.label} 시작까지 D-${stats.currentPhase.daysUntil}`
                    : stats.currentPhase.key === 'done' ? '프로젝트 종료'
                    : `${stats.currentPhase.label} 진행 중`}
                </div>
                {!stats.currentPhase.upcoming && stats.currentPhase.key !== 'done' && (
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
                    {stats.currentPhase.segElapsed}일째 / {stats.currentPhase.segDays}일
                  </div>
                )}
              </div>
            </div>
            {!stats.currentPhase.upcoming && stats.currentPhase.key !== 'done' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div className="phase-bar" style={{ width: 100, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div style={{ width: `${stats.currentPhase.pct}%`, height: '100%', background: SEG_COLORS[stats.currentPhase.key] || '#8b5cf6', borderRadius: 3, transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: SEG_COLORS[stats.currentPhase.key] || '#8b5cf6' }}>{stats.currentPhase.pct}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '16px 16px 40px' }}>
        {/* WARNINGS */}
        {warnings.length > 0 && (
          <div style={{ background: 'linear-gradient(90deg, #fef2f2, #fff7ed)', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: warnings.length > 1 ? 6 : 0 }}>
              <span style={{ fontSize: 15 }}>🚨</span>
              <span style={{ fontWeight: 800, color: COLORS.danger, fontSize: 13 }}>예산 경고 ({warnings.length}건)</span>
            </div>
            {warnings.map((w, i) => (
              <div key={i} style={{ color: w.level === 'error' ? COLORS.danger : COLORS.warning, fontSize: 12, marginLeft: 24, marginTop: 3, lineHeight: 1.5, fontWeight: w.level === 'error' ? 700 : 500, wordBreak: 'break-word' }}>
                {w.level === 'error' ? '🔴' : '🟡'} {w.msg}
              </div>
            ))}
          </div>
        )}

        {/* TABS */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 16, background: COLORS.card, borderRadius: 10, padding: 3, border: `1px solid ${COLORS.border}` }}>
          {tabItems.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className="resp-tab"
              style={{ background: tab === t.key ? COLORS.accent : 'transparent', color: tab === t.key ? '#fff' : COLORS.textMuted }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab stats={stats} expenses={expenses as unknown as Array<{ id: number; [key: string]: unknown }>} />}
        {tab === 'segments' && (
          <SegmentsTab
            stats={stats}
            budgetConfig={budgetConfig}
            onUpdateBudget={handleUpdateBudget}
            budgetStatus={budgetSaving ? 'saving' : syncStatus}
          />
        )}
        {tab === 'list' && (
          <ListTab
            expenses={expenses}
            onAdd={addExpense}
            onUpdate={updateExpense}
            onDelete={deleteExpense}
          />
        )}
        {tab === 'reimburse' && (
          <ReimburseTab
            expenses={expenses}
            stats={stats}
            onToggleReimbursed={(id, current) => updateExpense(id, { reimbursed: !current })}
          />
        )}

        {/* FOOTER */}
        <div style={{ marginTop: 28, textAlign: 'center', fontSize: 10, color: COLORS.textMuted, lineHeight: 1.7, wordBreak: 'break-word' }}>
          사회혁신학기 2026 · 경포대학교 고성리 프로젝트 · {APP_NAME} v3.1
          <br />이원 {HEADCOUNT}명 | 총예산 {fmt(TOTAL_BUDGET)}원 | 예비비 {fmt(stats.reserve)}원 | 가용 {fmt(stats.operating)}원
          <br />⚡ 실시간 공유 스토리지 · Supabase Realtime · 팀원 지출 등록 즉시 반영
        </div>
      </div>
    </div>
  )
}
