'use client'
import React, { useState, useRef, useCallback } from 'react'
import { Card, Badge, ProgressBar, Metric } from './ui'
import { COLORS, SEG_COLORS, SEGMENTS, TOTAL_BUDGET, fmt, daysBetween, fmtMan } from '@/lib/constants'
import type { Stats } from '@/types/stats'
import type { BudgetConfig } from '@/lib/supabase'

const STEP = 50000

type Props = {
  stats: Stats
  budgetConfig: BudgetConfig
  onUpdateBudget: (updates: Partial<Omit<BudgetConfig, 'id' | 'updated_at'>>) => Promise<void>
  budgetStatus: string
}

export default function SegmentsTab({ stats, budgetConfig, onUpdateBudget, budgetStatus }: Props) {
  const [draft, setDraft] = useState<Record<string, number>>({
    reserve: budgetConfig.reserve,
    jeju1: budgetConfig.jeju1,
    yeongam: budgetConfig.yeongam,
    jeju2: budgetConfig.jeju2,
  })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback((key: string, rawVal: number) => {
    const val = Math.round(rawVal / STEP) * STEP
    setDraft(prev => {
      const next = { ...prev, [key]: val }
      const total = Object.values(next).reduce((s, v) => s + v, 0)
      if (Math.abs(total - TOTAL_BUDGET) < 1000) {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          onUpdateBudget(next as Partial<Omit<BudgetConfig, 'id' | 'updated_at'>>)
        }, 600)
      }
      return next
    })
  }, [onUpdateBudget])

  const draftTotal = Object.values(draft).reduce((s, v) => s + v, 0)
  const gap = TOTAL_BUDGET - draftTotal
  const isBalanced = Math.abs(gap) < 1000

  const SEG_META = [
    { key: 'jeju1', color: SEG_COLORS.jeju1, bg: '#eef2ff', max: Math.round(TOTAL_BUDGET * 0.6) },
    { key: 'yeongam', color: SEG_COLORS.yeongam, bg: '#f0fdf4', max: Math.round(TOTAL_BUDGET * 0.8) },
    { key: 'jeju2', color: SEG_COLORS.jeju2, bg: '#fff1f2', max: Math.round(TOTAL_BUDGET * 0.7) },
  ]

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* 균형 바 */}
      <div style={{ background: COLORS.card, border: `1px solid ${isBalanced ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSec }}>
            💡 총예산 {fmt(TOTAL_BUDGET)}원 고정 · 5만원 단위 · 슬라이더/숫자 입력 즉시 저장
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: budgetStatus === 'saving' ? COLORS.warning : isBalanced ? COLORS.success : COLORS.danger }}>
            {budgetStatus === 'saving' ? '저장 중...' : isBalanced ? '✓ 균형 맞음' : `${fmt(Math.abs(gap))}원 ${gap > 0 ? '부족' : '초과'}`}
          </div>
        </div>
        <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
          {[{ key: 'reserve', color: '#b45309' }, ...SEG_META.map(m => ({ key: m.key, color: m.color }))].map(({ key, color }) => {
            const w = ((draft[key] || 0) / TOTAL_BUDGET) * 100
            return <div key={key} style={{ width: `${w}%`, background: color, transition: 'width 0.2s', minWidth: w > 0 ? 2 : 0 }} />
          })}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'reserve', label: '예비비', color: '#b45309' },
            { key: 'jeju1', label: '제주1차', color: SEG_COLORS.jeju1 },
            { key: 'yeongam', label: '영암', color: SEG_COLORS.yeongam },
            { key: 'jeju2', label: '제주2차', color: SEG_COLORS.jeju2 },
          ].map(({ key, label, color }) => (
            <span key={key} style={{ fontSize: 10, color, fontWeight: 700 }}>
              ■ {label} {(((draft[key] || 0) / TOTAL_BUDGET) * 100).toFixed(0)}%
            </span>
          ))}
        </div>
      </div>

      {/* 예비비 */}
      <Card style={{ border: '1px solid #fde68a', background: '#fffbeb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#92400e' }}>예비비 (비상금)</div>
              <div style={{ fontSize: 10, color: '#a16207' }}>총예산의 {(((draft.reserve || 0) / TOTAL_BUDGET) * 100).toFixed(1)}% · PM 사전 승인 필요</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="number" value={Math.round((draft.reserve || 0) / 10000)}
              onChange={e => { const v = Number(e.target.value) * 10000; if (!isNaN(v) && v >= 0) handleChange('reserve', v) }}
              style={{ width: 80, padding: '5px 8px', border: '1px solid #b4530950', borderRadius: 7, fontSize: 13, fontWeight: 700, color: '#b45309', background: '#fff', textAlign: 'right', outline: 'none' }} />
            <span style={{ fontSize: 12, color: '#b45309', fontWeight: 600, whiteSpace: 'nowrap' }}>만원</span>
          </div>
        </div>
        <input type="range" min={0} max={Math.round(TOTAL_BUDGET * 0.3)} step={STEP}
          value={draft.reserve || 0}
          onChange={e => handleChange('reserve', Number(e.target.value))}
          style={{ width: '100%', accentColor: '#b45309' }} />
        <div style={{ fontSize: 11, color: '#a16207', marginTop: 6 }}>현재 <strong>{fmt(draft.reserve || 0)}원</strong></div>
      </Card>

      {/* 구간별 카드 */}
      {SEG_META.map(({ key, color, bg, max }) => {
        const seg = SEGMENTS[key]
        const d = stats.bySegment[key]
        const bgt = draft[key] || 0
        const pct = bgt > 0 ? ((d.total / bgt) * 100).toFixed(1) : '0.0'
        const over = d.total > bgt
        const projOver = d.projected > bgt && d.segElapsed > 1
        const isCurrent = stats.currentPhase.key === key && !stats.currentPhase.upcoming
        const delta = bgt - (budgetConfig[key as keyof BudgetConfig] as number || 0)

        return (
          <Card key={key} style={{ border: isCurrent ? `2px solid ${color}50` : `1px solid ${color}20`, background: bg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{seg.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color }}>
                    {seg.label}
                    {isCurrent && <span style={{ fontSize: 10, fontWeight: 700, color, marginLeft: 8, background: color + '18', padding: '1px 7px', borderRadius: 4 }}>현재 · {d.segElapsed}일째</span>}
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted }}>{seg.start} ~ {seg.end} · {daysBetween(seg.start, seg.end)}일간</div>
                </div>
              </div>
              <Badge bg={over ? COLORS.dangerSoft : Number(pct) > 85 ? COLORS.warningSoft : COLORS.successSoft}
                color={over ? COLORS.danger : Number(pct) > 85 ? COLORS.warning : COLORS.success}>
                {over ? '초과!' : `집행 ${pct}%`}
              </Badge>
            </div>

            <ProgressBar value={d.total} max={bgt} color={color} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginTop: 12 }}>
              <Metric label="배정 예산" value={fmt(bgt) + '원'} color={color} small />
              <Metric label="실제 집행" value={fmt(d.actual) + '원'} color={COLORS.actual} small />
              <Metric label="예정 집행" value={fmt(d.planned) + '원'} color={COLORS.textMuted} small />
              <Metric label="잔액" value={fmt(bgt - d.total) + '원'} color={over ? COLORS.danger : COLORS.success} small />
              {d.segElapsed > 0 && <Metric label="구간 번레이트" value={fmt(d.segBurn) + '원/일'} color={projOver ? COLORS.danger : COLORS.textSec} small />}
              {d.segElapsed > 0 && <Metric label="예상 이용액" value={fmt(d.projected) + '원'} color={projOver ? COLORS.danger : COLORS.textSec} small />}
            </div>

            {/* 배정 예산 조정 슬라이더 */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${color}20` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color }}>▶ 배정 예산 조정</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {delta !== 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: delta > 0 ? COLORS.success : COLORS.danger }}>
                      {delta > 0 ? '▲' : '▼'} {fmt(Math.abs(delta))}원
                    </span>
                  )}
                  <input type="number" value={Math.round(bgt / 10000)}
                    onChange={e => { const v = Number(e.target.value) * 10000; if (!isNaN(v) && v >= 0) handleChange(key, v) }}
                    style={{ width: 80, padding: '4px 8px', border: `1px solid ${color}50`, borderRadius: 7, fontSize: 13, fontWeight: 700, color, background: '#fff', textAlign: 'right', outline: 'none' }} />
                  <span style={{ fontSize: 11, color, fontWeight: 600, whiteSpace: 'nowrap' }}>만원</span>
                </div>
              </div>
              <input type="range" min={0} max={max} step={STEP}
                value={bgt}
                onChange={e => handleChange(key, Number(e.target.value))}
                style={{ width: '100%', accentColor: color }} />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
