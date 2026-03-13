'use client'
import React from 'react'
import { COLORS } from '@/lib/constants'

export function Card({ children, style, ...props }: React.HTMLAttributes<HTMLDivElement> & { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: COLORS.card,
        borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        padding: '18px 20px',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function Badge({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: bg, color }}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, max, color, height = 8 }: { value: number; max: number; color: string; height?: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  const over = value > max
  return (
    <div>
      <div style={{ background: '#e2e8f0', borderRadius: height, height, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: over ? COLORS.danger : color, borderRadius: height, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 11, color: over ? COLORS.danger : COLORS.textMuted }}>
        <span>{Math.round(value).toLocaleString('ko-KR')}원 / {Math.round(max).toLocaleString('ko-KR')}원</span>
        <span style={{ fontWeight: 700 }}>{pct.toFixed(1)}%</span>
      </div>
    </div>
  )
}

export function Metric({ label, value, sub, color, small }: { label: string; value: string; sub?: string; color?: string; small?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ fontSize: small ? 16 : 20, fontWeight: 800, color: color || COLORS.text, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 1 }}>{sub}</div>}
    </div>
  )
}

export const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color?: string; fill?: string; name: string; value: number }>; label?: string }) => {
  if (!active || !payload) return null
  return (
    <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.fill, marginTop: 2 }}>
          {p.name}: {Math.round(p.value).toLocaleString('ko-KR')}원
        </div>
      ))}
    </div>
  )
}
