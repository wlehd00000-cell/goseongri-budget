'use client'
import React, { useState, useCallback } from 'react'
import { Card, Badge } from './ui'
import { COLORS, SEG_COLORS, SEGMENTS, TEAMS, CATEGORIES, fmt, todayStr } from '@/lib/constants'
import type { Expense } from '@/lib/supabase'

type Props = {
  expenses: Expense[]
  onAdd: (exp: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onUpdate: (id: number, updates: Partial<Expense>) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

const emptyForm = () => ({
  date: todayStr(),
  category: CATEGORIES[0],
  team: TEAMS[0],
  segment: 'jeju1',
  status: '실제',
  amount: '',
  memo: '',
  reimburse: false,
  paid_by: '',
  reimbursed: false,
})

export default function ListTab({ expenses, onAdd, onUpdate, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [form, setForm] = useState<ReturnType<typeof emptyForm>>(emptyForm())
  const [filter, setFilter] = useState({ segment: 'all', team: 'all', status: 'all', reimburse: 'all' })
  const [sortCol, setSortCol] = useState('date')
  const [sortAsc, setSortAsc] = useState(true)
  const [saving, setSaving] = useState(false)

  const selectStyle = { padding: '6px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 12, background: '#fff', color: COLORS.text, outline: 'none' }
  const inputStyle = { width: '100%', padding: '9px 11px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: '#f8fafc', color: COLORS.text, boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 3, display: 'block' }

  const handleSubmit = useCallback(async () => {
    if (!form.amount || Number(form.amount) <= 0) return
    setSaving(true)
    try {
      const payload = {
        date: form.date,
        category: form.category,
        team: form.team,
        segment: form.segment,
        status: form.status,
        amount: Number(form.amount),
        memo: form.memo,
        reimburse: form.reimburse,
        paid_by: form.paid_by,
        reimbursed: form.reimbursed,
      }
      if (editId !== null) {
        await onUpdate(editId, payload)
        setEditId(null)
      } else {
        await onAdd(payload)
      }
      setForm(emptyForm())
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }, [form, editId, onAdd, onUpdate])

  const startEdit = useCallback((e: Expense) => {
    setForm({ date: e.date, category: e.category, team: e.team, segment: e.segment, status: e.status, amount: String(e.amount), memo: e.memo, reimburse: !!e.reimburse, paid_by: e.paid_by || '', reimbursed: !!e.reimbursed })
    setEditId(e.id)
    setShowForm(true)
  }, [])

  let list = [...expenses]
  if (filter.segment !== 'all') list = list.filter(e => e.segment === filter.segment)
  if (filter.team !== 'all') list = list.filter(e => e.team === filter.team)
  if (filter.status !== 'all') list = list.filter(e => e.status === filter.status)
  if (filter.reimburse === 'pending') list = list.filter(e => e.reimburse && !e.reimbursed)
  if (filter.reimburse === 'done') list = list.filter(e => e.reimburse && e.reimbursed)
  if (filter.reimburse === 'all_reimburse') list = list.filter(e => e.reimburse)
  list.sort((a, b) => {
    const va = (a as Record<string, unknown>)[sortCol]
    const vb = (b as Record<string, unknown>)[sortCol]
    if (sortCol === 'amount') return sortAsc ? (a.amount - b.amount) : (b.amount - a.amount)
    if (typeof va === 'string' && typeof vb === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
    return 0
  })

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* TOOLBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <select value={filter.segment} onChange={e => setFilter({ ...filter, segment: e.target.value })} style={selectStyle}>
            <option value="all">전체 구간</option>
            {Object.entries(SEGMENTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
          <select value={filter.team} onChange={e => setFilter({ ...filter, team: e.target.value })} style={selectStyle}>
            <option value="all">전체 팀</option>
            {TEAMS.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })} style={selectStyle}>
            <option value="all">전체 상태</option>
            <option>실제</option>
            <option>예정</option>
          </select>
          <select value={filter.reimburse} onChange={e => setFilter({ ...filter, reimburse: e.target.value })} style={selectStyle}>
            <option value="all">전체 (개인결제 포함)</option>
            <option value="all_reimburse">개인결제 전체</option>
            <option value="pending">미정산만</option>
            <option value="done">정산완료만</option>
          </select>
        </div>
        <button onClick={() => { setShowForm(!showForm); if (editId) { setEditId(null); setForm(emptyForm()) } }}
          style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: showForm ? COLORS.textMuted : COLORS.accent, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          {showForm ? '✕ 닫기' : '+ 지출 등록'}
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <Card style={{ border: `2px solid ${editId ? '#f59e0b' : COLORS.accent}22` }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14, color: editId ? COLORS.warning : COLORS.accent }}>
            {editId ? '✏️ 지출 수정' : '📝 지출 등록'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            <div><label style={labelStyle}>날짜</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>항목</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label style={labelStyle}>팀</label><select value={form.team} onChange={e => setForm({ ...form, team: e.target.value })} style={inputStyle}>{TEAMS.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label style={labelStyle}>구간</label><select value={form.segment} onChange={e => setForm({ ...form, segment: e.target.value })} style={inputStyle}>{Object.entries(SEGMENTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select></div>
            <div><label style={labelStyle}>상태</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}><option>실제</option><option>예정</option></select></div>
            <div><label style={labelStyle}>금액 (원)</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" style={inputStyle} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>메모</label><input type="text" value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} placeholder="지출 내용을 간단히 기록" style={inputStyle} /></div>
            <div style={{ gridColumn: '1 / -1', borderTop: `1px solid ${COLORS.border}`, paddingTop: 10, marginTop: 2 }}>
              <label style={{ ...labelStyle, color: COLORS.reimburse, marginBottom: 8 }}>💳 개인결제 여부</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="reimburse-chk" checked={!!form.reimburse} onChange={e => setForm({ ...form, reimburse: e.target.checked, paid_by: e.target.checked ? form.paid_by : '', reimbursed: e.target.checked ? form.reimbursed : false })} />
                <label htmlFor="reimburse-chk" style={{ fontSize: 12, color: COLORS.textSec, cursor: 'pointer' }}>개인 카드/현금으로 결제 (소급정산 필요)</label>
              </div>
              {form.reimburse && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  <div>
                    <label style={labelStyle}>결제자 이름</label>
                    <input type="text" value={form.paid_by} onChange={e => setForm({ ...form, paid_by: e.target.value })} placeholder="홍길동" style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 18 }}>
                    <input type="checkbox" id="reimbursed-chk" checked={!!form.reimbursed} onChange={e => setForm({ ...form, reimbursed: e.target.checked })} />
                    <label htmlFor="reimbursed-chk" style={{ fontSize: 12, color: COLORS.success, cursor: 'pointer', fontWeight: 700 }}>✅ 정산 완료</label>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={handleSubmit} disabled={saving}
              style={{ flex: 1, padding: '11px', borderRadius: 8, border: 'none', background: saving ? '#94a3b8' : editId ? COLORS.warning : COLORS.accent, color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '저장 중...' : editId ? '✓ 수정 완료' : '✓ 등록하기'}
            </button>
            {editId && (
              <button onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(false) }}
                style={{ padding: '11px 20px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: '#fff', color: COLORS.textSec, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                취소
              </button>
            )}
          </div>
        </Card>
      )}

      {/* SUMMARY */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12 }}>
        <span style={{ color: COLORS.textMuted }}>조회: <strong style={{ color: COLORS.text }}>{list.length}건</strong></span>
        <span style={{ color: COLORS.textMuted }}>합계: <strong style={{ color: COLORS.text }}>{fmt(list.reduce((s, e) => s + e.amount, 0))}원</strong></span>
      </div>

      {/* TABLE */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {[
                  { key: 'date', label: '날짜' },
                  { key: 'category', label: '항목' },
                  { key: 'team', label: '팀' },
                  { key: 'segment', label: '구간' },
                  { key: 'status', label: '상태' },
                  { key: 'amount', label: '금액' },
                  { key: 'memo', label: '메모' },
                  { key: 'reimburse', label: '개인결제' },
                  { key: '', label: '' },
                ].map(h => (
                  <th key={h.key || h.label} onClick={() => { if (h.key) { setSortCol(h.key); setSortAsc(sortCol === h.key ? !sortAsc : true) } }}
                    style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: COLORS.textMuted, borderBottom: `1px solid ${COLORS.border}`, whiteSpace: 'nowrap', cursor: h.key ? 'pointer' : 'default', userSelect: 'none' }}>
                    {h.label} {sortCol === h.key ? (sortAsc ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(e => (
                <tr key={e.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{e.date}</td>
                  <td style={{ padding: '10px 12px' }}>{e.category}</td>
                  <td style={{ padding: '10px 12px' }}>{e.team}</td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <Badge bg={SEG_COLORS[e.segment] + '15'} color={SEG_COLORS[e.segment]}>{SEGMENTS[e.segment].icon} {SEGMENTS[e.segment].label}</Badge>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <button onClick={() => onUpdate(e.id, { status: e.status === '실제' ? '예정' : '실제' })}
                      title="클릭하면 상태 전환"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                      <Badge bg={e.status === '실제' ? COLORS.accentSoft : '#f1f5f9'} color={e.status === '실제' ? COLORS.actual : COLORS.textMuted}>
                        {e.status === '실제' ? '✓ 실제' : '↻ 예정'}
                      </Badge>
                    </button>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{fmt(e.amount)}원</td>
                  <td style={{ padding: '10px 12px', color: COLORS.textSec, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.memo}</td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    {e.reimburse ? (
                      <button onClick={() => onUpdate(e.id, { reimbursed: !e.reimbursed })} title="클릭하면 정산 상태 전환" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                        <Badge bg={e.reimbursed ? COLORS.successSoft : COLORS.reimburseSoft} color={e.reimbursed ? COLORS.success : COLORS.reimburse}>
                          {e.reimbursed ? '✅ 정산완료' : `💳 ${e.paid_by || '미지정'}`}
                        </Badge>
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: COLORS.textMuted }}>–</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => startEdit(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '2px 5px', color: COLORS.textMuted }} title="수정">✏️</button>
                    {confirmDelete === e.id ? (
                      <span style={{ fontSize: 11 }}>
                        <button onClick={() => onDelete(e.id).then(() => setConfirmDelete(null))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.danger, fontWeight: 700, fontSize: 11, padding: '2px 4px' }}>확인</button>
                        <button onClick={() => setConfirmDelete(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, fontSize: 11, padding: '2px 4px' }}>취소</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmDelete(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '2px 5px', color: COLORS.textMuted }} title="삭제">🗑️</button>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 36, textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>조건에 맞는 지출 내역이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
