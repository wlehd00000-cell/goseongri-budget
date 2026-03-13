'use client'
import React, { useState } from 'react'
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts'
import { Card, Badge, CustomTooltip } from './ui'
import { COLORS, SEG_COLORS, SEGMENTS, fmt, fmtMan } from '@/lib/constants'
import type { Stats } from '@/types/stats'

export default function OverviewTab({ stats, expenses }: { stats: Stats; expenses: Array<{ id: number; [key: string]: unknown }> }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const pieData = [
    { name: '실제 지출', value: stats.actual, color: COLORS.actual },
    { name: '예정 지출', value: stats.planned, color: COLORS.planned },
    { name: '잔액', value: Math.max(stats.remaining, 0), color: '#e2e8f0' },
  ].filter(d => d.value > 0)

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {/* PIE */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>예산 집행 현황</div>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(Number(v)) + '원'} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 6 }}>
            {[{ l: '실제', c: COLORS.actual, v: stats.actual }, { l: '예정', c: COLORS.planned, v: stats.planned }].map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.c }} />
                <span style={{ color: COLORS.textMuted }}>{d.l}</span>
                <span style={{ fontWeight: 700 }}>{fmt(d.v)}원</span>
              </div>
            ))}
          </div>
        </Card>

        {/* BURN CHART */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>실제 지출 누적 추이</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 12 }}>시간 경과 → 지출 속도: 기울기가 가파르면 번아웃 과다</div>
          {stats.dailyCum.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={stats.dailyCum}>
                <defs>
                  <linearGradient id="burnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.accent} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={COLORS.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtMan(v)} />
                <Tooltip formatter={(v) => fmt(Number(v)) + '원'} />
                <Area type="monotone" dataKey="amount" stroke={COLORS.accent} strokeWidth={2} fill="url(#burnGrad)" name="누적 실제지출" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted, fontSize: 12 }}>실제 지출 데이터가 등록되면 차트가 표시됩니다.</div>
          )}
        </Card>
      </div>

      {/* TEAM + CATEGORY BARS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>팀별 지출</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.teamBarData} barCategoryGap="20%">
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtMan(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="실제" fill={COLORS.actual} radius={[4, 4, 0, 0]} />
              <Bar dataKey="예정" fill={COLORS.planned} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>항목별 지출</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.catBarData} barCategoryGap="15%">
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtMan(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="실제" fill={COLORS.jeju1} radius={[4, 4, 0, 0]} />
              <Bar dataKey="예정" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* DAILY BAR CHART */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>일자별 지출 현황</div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 12 }}>막대를 클릭하면 해당 일자의 상세 내역을 확인할 수 있습니다</div>
        {stats.dailyBarData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.dailyBarData} barCategoryGap="20%"
              onClick={(data) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const d = data as any
                if (d?.activePayload?.[0]) {
                  const clickedDate = d.activePayload[0].payload.fullDate as string
                  setSelectedDate(selectedDate === clickedDate ? null : clickedDate)
                }
              }} style={{ cursor: 'pointer' }}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtMan(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="실제" stackId="daily" fill={COLORS.actual} />
              <Bar dataKey="예정" stackId="daily" fill={COLORS.planned} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted, fontSize: 12 }}>지출 데이터가 등록되면 일자별 차트가 표시됩니다.</div>
        )}
      </Card>

      {/* DAILY LEDGER TABLE */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>📒 일자별 지출 장부</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>{stats.byDate.length}일 / 총 {expenses.length}건</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['날짜', '실제', '예정', '합계', '건수'].map((h, i) => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: i === 0 ? 'left' : i === 4 ? 'center' : 'right', fontWeight: 700, fontSize: 11, color: i === 1 ? COLORS.actual : COLORS.textMuted, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.byDate.map((d) => {
                const isOpen = selectedDate === d.date
                const weekday = ['일', '월', '화', '수', '목', '금', '토'][new Date(d.date).getDay()]
                return (
                  <React.Fragment key={d.date}>
                    <tr onClick={() => setSelectedDate(isOpen ? null : d.date)} style={{ borderBottom: `1px solid ${isOpen ? COLORS.accent + '30' : COLORS.borderLight}`, cursor: 'pointer', background: isOpen ? COLORS.accentSoft : 'transparent', transition: 'background 0.15s' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        <span style={{ marginRight: 6 }}>{isOpen ? '▾' : '▸'}</span>
                        {d.date} <span style={{ fontSize: 10, color: COLORS.textMuted }}>({weekday})</span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: COLORS.actual, fontVariantNumeric: 'tabular-nums' }}>{d.actual > 0 ? fmt(d.actual) + '원' : '–'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: COLORS.textMuted, fontVariantNumeric: 'tabular-nums' }}>{d.planned > 0 ? fmt(d.planned) + '원' : '–'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{fmt(d.total)}원</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}><Badge bg={COLORS.accentSoft} color={COLORS.accent}>{d.count}</Badge></td>
                    </tr>
                    {isOpen && d.items.map((item, idx) => (
                      <tr key={item.id} style={{ background: '#f8fafc', borderBottom: idx === d.items.length - 1 ? `2px solid ${COLORS.accent}30` : `1px solid ${COLORS.borderLight}` }}>
                        <td style={{ padding: '7px 14px 7px 36px', fontSize: 11, color: COLORS.textSec }}>
                          <Badge bg={SEG_COLORS[item.segment] + '15'} color={SEG_COLORS[item.segment]}>{SEGMENTS[item.segment].icon} {SEGMENTS[item.segment].label}</Badge>
                          <span style={{ marginLeft: 8 }}>{item.category}</span>
                          <span style={{ marginLeft: 6, color: COLORS.textMuted }}>· {item.team}</span>
                        </td>
                        <td colSpan={2} style={{ padding: '7px 14px', fontSize: 11, color: COLORS.textMuted, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.memo || ''}</td>
                        <td style={{ padding: '7px 14px', textAlign: 'right', fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(item.amount)}원</td>
                        <td style={{ padding: '7px 14px', textAlign: 'center' }}>
                          <Badge bg={item.status === '실제' ? COLORS.accentSoft : '#f1f5f9'} color={item.status === '실제' ? COLORS.actual : COLORS.textMuted}>{item.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                )
              })}
              {stats.byDate.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: COLORS.textMuted, fontSize: 12 }}>등록된 지출이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
