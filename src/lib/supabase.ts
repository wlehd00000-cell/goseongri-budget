import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Expense = {
  id: number
  date: string
  category: string
  team: string
  segment: string
  status: string
  amount: number
  memo: string
  reimburse: boolean
  paid_by: string
  reimbursed: boolean
  created_at: string
  updated_at: string
}

export type BudgetConfig = {
  id: number
  reserve: number
  jeju1: number
  yeongam: number
  jeju2: number
  updated_at: string
}
