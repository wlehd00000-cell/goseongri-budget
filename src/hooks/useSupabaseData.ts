'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, Expense, BudgetConfig } from '@/lib/supabase'
import { INITIAL_BUDGET_CONFIG } from '@/lib/constants'

type SyncStatus = 'loading' | 'synced' | 'saving' | 'error' | 'local'

export function useSupabaseData() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading')
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [newDataToast, setNewDataToast] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialLoad = useRef(true)

  const showToast = useCallback(() => {
    if (isInitialLoad.current) return
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setNewDataToast(true)
    toastTimer.current = setTimeout(() => setNewDataToast(false), 3000)
  }, [])

  // 초기 데이터 로드
  const fetchAll = useCallback(async () => {
    try {
      const [expRes, budRes] = await Promise.all([
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('budget_config').select('*').limit(1).single(),
      ])

      if (expRes.error) throw expRes.error
      if (expRes.data) setExpenses(expRes.data)

      if (budRes.error && budRes.error.code !== 'PGRST116') throw budRes.error
      if (budRes.data) {
        setBudgetConfig(budRes.data)
      } else {
        // 없으면 기본값 insert
        const { data: inserted } = await supabase
          .from('budget_config')
          .insert([INITIAL_BUDGET_CONFIG])
          .select()
          .single()
        if (inserted) setBudgetConfig(inserted)
      }

      setSyncStatus('synced')
      setLastSync(new Date())
    } catch (err) {
      console.error('fetchAll error:', err)
      setSyncStatus('error')
    } finally {
      setLoading(false)
      isInitialLoad.current = false
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Realtime 구독
  useEffect(() => {
    const channel = supabase
      .channel('budget-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
        setExpenses(prev => {
          if (payload.eventType === 'INSERT') {
            showToast()
            return [payload.new as Expense, ...prev]
          }
          if (payload.eventType === 'UPDATE') {
            showToast()
            return prev.map(e => e.id === (payload.new as Expense).id ? payload.new as Expense : e)
          }
          if (payload.eventType === 'DELETE') {
            showToast()
            return prev.filter(e => e.id !== (payload.old as Expense).id)
          }
          return prev
        })
        setLastSync(new Date())
        setSyncStatus('synced')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_config' }, (payload) => {
        if (payload.eventType !== 'DELETE') {
          setBudgetConfig(payload.new as BudgetConfig)
          showToast()
          setLastSync(new Date())
        }
      })
      .subscribe((status) => {
        if (status === 'CLOSED') {
          // 재연결 시도
          setTimeout(() => fetchAll(), 3000)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAll, showToast])

  // CRUD
  const addExpense = useCallback(async (exp: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
    setSyncStatus('saving')
    const { data, error } = await supabase.from('expenses').insert([exp]).select().single()
    if (error) { setSyncStatus('error'); throw error }
    // realtime이 처리하지만 빠른 UI 반영
    if (data) setExpenses(prev => [data, ...prev])
    setSyncStatus('synced')
    setLastSync(new Date())
    return data
  }, [])

  const updateExpense = useCallback(async (id: number, updates: Partial<Expense>) => {
    setSyncStatus('saving')
    const { error } = await supabase.from('expenses').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { setSyncStatus('error'); throw error }
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
    setSyncStatus('synced')
    setLastSync(new Date())
  }, [])

  const deleteExpense = useCallback(async (id: number) => {
    setSyncStatus('saving')
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) { setSyncStatus('error'); throw error }
    setExpenses(prev => prev.filter(e => e.id !== id))
    setSyncStatus('synced')
    setLastSync(new Date())
  }, [])

  const updateBudgetConfig = useCallback(async (updates: Partial<Omit<BudgetConfig, 'id' | 'updated_at'>>) => {
    setSyncStatus('saving')
    const { data, error } = await supabase
      .from('budget_config')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', budgetConfig!.id)
      .select()
      .single()
    if (error) { setSyncStatus('error'); throw error }
    if (data) setBudgetConfig(data)
    setSyncStatus('synced')
    setLastSync(new Date())
  }, [budgetConfig])

  const resetAll = useCallback(async () => {
    setSyncStatus('saving')
    // delete all expenses
    await supabase.from('expenses').delete().neq('id', 0)
    // reset budget
    await supabase.from('budget_config').update({ ...INITIAL_BUDGET_CONFIG, updated_at: new Date().toISOString() }).eq('id', budgetConfig!.id)
    await fetchAll()
  }, [budgetConfig, fetchAll])

  return {
    expenses,
    budgetConfig,
    loading,
    syncStatus,
    lastSync,
    newDataToast,
    addExpense,
    updateExpense,
    deleteExpense,
    updateBudgetConfig,
    resetAll,
  }
}
