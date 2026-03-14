export const APP_NAME = '스마트 지출 정리 보드'
export const TOTAL_BUDGET = 42000000
export const HEADCOUNT = 15

export const PROJECT_START = '2026-03-15'
export const PROJECT_END = '2026-06-19'

export const SEGMENTS: Record<string, { label: string; start: string; end: string; icon: string }> = {
  jeju1: {
    label: '제주 1차',
    start: '2026-03-15',
    end: '2026-03-31',
    icon: '🏝️',
  },
  yeongam: {
    label: '영암',
    start: '2026-04-07',
    end: '2026-05-13',
    icon: '🏕️',
  },
  jeju2: {
    label: '제주 2차 (축제)',
    start: '2026-05-19',
    end: '2026-06-19',
    icon: '🎪',
  },
}

export const TEAMS = ['기획팀', '조리팀', '디자인팀', '영상팀', '공통']
export const CATEGORIES = ['교통비', '식비', '재료비', '디자인·제작', '운영비', '기타']

export const COLORS = {
  bg: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  text: '#0f172a',
  textSec: '#475569',
  textMuted: '#94a3b8',
  accent: '#1d4ed8',
  accentSoft: '#dbeafe',
  actual: '#1d4ed8',
  planned: '#93c5fd',
  success: '#059669',
  successSoft: '#d1fae5',
  warning: '#d97706',
  warningSoft: '#fef3c7',
  danger: '#dc2626',
  dangerSoft: '#fee2e2',
  reserve: '#b45309',
  jeju1: '#6366f1',
  yeongam: '#059669',
  jeju2: '#e11d48',
  reimburse: '#7c3aed',
  reimburseSoft: '#ede9fe',
}

export const SEG_COLORS: Record<string, string> = {
  jeju1: COLORS.jeju1,
  yeongam: COLORS.yeongam,
  jeju2: COLORS.jeju2,
}

export const INITIAL_BUDGET_CONFIG = {
  reserve: Math.round(TOTAL_BUDGET * 0.15),
  jeju1: Math.round(TOTAL_BUDGET * 0.85 * 0.15),
  yeongam: Math.round(TOTAL_BUDGET * 0.85 * 0.50),
  jeju2: Math.round(TOTAL_BUDGET * 0.85 * 0.35),
}

export const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR')
export const fmtMan = (n: number) => {
  if (Math.abs(n) >= 10000) return (n / 10000).toFixed(1) + '만'
  return fmt(n)
}

export const daysBetween = (a: string, b: string) =>
  Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))

export const todayStr = () => new Date().toISOString().slice(0, 10)
