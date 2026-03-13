'use client'
import React from 'react'
import { Card, Badge } from './ui'
import { COLORS, fmt } from '@/lib/constants'
import type { Expense } from '@/lib/supabase'
import type { Stats } from '@/types/stats'

type Props = {
  expenses: Expense[]
  stats: Stats
  onToggleReimbursed: (id: number, current: boolean) => Promise<void>
}

export default function ReimburseTab({ expenses, stats, onToggleReimbursed }: Props) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        {[
          { label: '미정산 건수', value: `${stats.reimbPendingCount}건`, sub: '소급 환급 필요', color: COLORS.reimburse, bg: COLORS.reimburseSoft },
          { label: '미정산 이액', value: `${fmt(stats.reimbPendingTotal)}원`, sub: '즉시 처리 필요', color: COLORS.danger, bg: COLORS.dangerSoft },
          { label: '정산완료 건수', value: `${stats.reimbDoneCount}건`, sub: '처리 완료', color: COLORS.success, bg: COLORS.successSoft },
          { label: '정산완료 이액', value: `${fmt(stats.reimbDoneTotal)}원`, sub: '현금 처리됨', color: COLORS.success, bg: COLORS.successSoft },
        ].map((m, i) => (
          <Card key={i} style={{ background: m.bg, border: `1px solid ${m.color}30` }}>
            <div style={{ fontSize: 11, color: m.color, fontWeight: 700, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 10, color: m.color, opacity: 0.7, marginTop: 2 }}>{m.sub}</div>
          </Card>
        ))}
      </div>

      {/* 인별 미정산 현황 */}
      {Object.keys(stats.reimbByPerson).length > 0 && (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: COLORS.reimburse }}>💳 인별 미정산 현황</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {Object.entries(stats.reimbByPerson).map(([name, info]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: COLORS.reimburseSoft, borderRadius: 8, border: `1px solid ${COLORS.reimburse}20` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: COLORS.reimburse, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>
                    {name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{name}</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>{info.count}건 결제</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.reimburse }}>{fmt(info.amount)}원</div>
                  <div style={{ fontSize: 10, color: COLORS.danger, fontWeight: 600 }}>미정산</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 전체 내역 테이블 */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>💳 소급정산 전체 내역</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>배지 클릭 → 정산 상태 즉시 전환</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['날짜', '항목', '팀', '결제자', '금액', '메모', '정산상태'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: COLORS.textMuted, borderBottom: `1px solid ${COLORS.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.filter(e => e.reimburse).sort((a, b) => {
                if (a.reimbursed !== b.reimbursed) return a.reimbursed ? 1 : -1
                return b.date.localeCompare(a.date)
              }).map(e => (
                <tr key={e.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}`, background: e.reimbursed ? '#f0fdf4' : '#faf5ff' }}>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{e.date}</td>
                  <td style={{ padding: '10px 12px' }}>{e.category}</td>
                  <td style={{ padding: '10px 12px' }}>{e.team}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: COLORS.reimburse }}>{e.paid_by || '미지정'}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{fmt(e.amount)}원</td>
                  <td style={{ padding: '10px 12px', color: COLORS.textSec, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.memo}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <button onClick={() => onToggleReimbursed(e.id, e.reimbursed)} title="클릭하면 정산 상태 전환" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                      <Badge bg={e.reimbursed ? COLORS.successSoft : COLORS.reimburseSoft} color={e.reimbursed ? COLORS.success : COLORS.reimburse}>
                        {e.reimbursed ? '✅ 정산완료' : '⏳ 미정산'}
                      </Badge>
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.filter(e => e.reimburse).length === 0 && (
                <tr><td colSpan={7} style={{ padding: 36, textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>등록된 개인결제 내역이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 사용 안내 */}
      <Card style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.8 }}>
          <strong>📖 소급정산 사용 방법</strong><br />
          1. 지출 등록 시 &quot;개인결제&quot; 체크 + 결제자 이름 입력<br />
          2. 이 탭에서 인별 미정산 금액 확인<br />
          3. 실제 현금 지급 완료 후 배지 클릭 → 정산완료 처리<br />
          4. CSV 내보내기에 소급정산 현황 자동 포함
        </div>
      </Card>
    </div>
  )
}
