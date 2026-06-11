// Mock data for demo mode (when Supabase is not connected)

export const MOCK_USER = {
  id: 'demo-user',
  email: 'demo@wdmg.app',
  plan_type: 'free' as const,
  is_premium: false,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  subscription_status: null,
  created_at: '2025-01-01',
}

export const MOCK_EXPENSES = [
  { id: '1', user_id: 'demo-user', name: 'Coffee', category: 'food', amount: 3.50, frequency: 'daily', date: '2025-06-10', created_at: '2025-06-10' },
  { id: '2', user_id: 'demo-user', name: 'Netflix', category: 'subscriptions', amount: 15.99, frequency: 'monthly', date: '2025-06-01', created_at: '2025-06-01' },
  { id: '3', user_id: 'demo-user', name: 'Cigarettes', category: 'habits', amount: 8.00, frequency: 'daily', date: '2025-06-09', created_at: '2025-06-09' },
  { id: '4', user_id: 'demo-user', name: 'Uber', category: 'transport', amount: 12.50, frequency: 'weekly', date: '2025-06-08', created_at: '2025-06-08' },
  { id: '5', user_id: 'demo-user', name: 'Amazon Shopping', category: 'shopping', amount: 45.00, frequency: 'monthly', date: '2025-06-05', created_at: '2025-06-05' },
  { id: '6', user_id: 'demo-user', name: 'Gym', category: 'health', amount: 30.00, frequency: 'monthly', date: '2025-06-01', created_at: '2025-06-01' },
  { id: '7', user_id: 'demo-user', name: 'Fast Food', category: 'food', amount: 9.50, frequency: 'weekly', date: '2025-06-07', created_at: '2025-06-07' },
  { id: '8', user_id: 'demo-user', name: 'Spotify', category: 'subscriptions', amount: 9.99, frequency: 'monthly', date: '2025-06-01', created_at: '2025-06-01' },
  { id: '9', user_id: 'demo-user', name: 'Lunch', category: 'food', amount: 7.50, frequency: 'daily', date: '2025-06-10', created_at: '2025-06-10' },
  { id: '10', user_id: 'demo-user', name: 'Beer', category: 'habits', amount: 5.00, frequency: 'weekly', date: '2025-06-06', created_at: '2025-06-06' },
]

export const MOCK_GOALS = [
  { id: '1', user_id: 'demo-user', name: 'New iPhone 16', target_amount: 1200, current_amount: 350, deadline: '2025-12-31', created_at: '2025-01-01' },
  { id: '2', user_id: 'demo-user', name: 'Summer Vacation', target_amount: 2000, current_amount: 800, deadline: '2025-08-31', created_at: '2025-01-01' },
  { id: '3', user_id: 'demo-user', name: 'Emergency Fund', target_amount: 5000, current_amount: 1200, deadline: '2026-06-30', created_at: '2025-01-01' },
]

// LocalStorage helpers
const EXPENSES_KEY = 'wdmg_expenses'
const GOALS_KEY = 'wdmg_goals'

export function getLocalExpenses(): typeof MOCK_EXPENSES {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(EXPENSES_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveLocalExpense(expense: typeof MOCK_EXPENSES[0]) {
  const existing = getLocalExpenses()
  existing.unshift(expense)
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(existing))
}

export function deleteLocalExpense(id: string) {
  const existing = getLocalExpenses().filter(e => e.id !== id)
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(existing))
}

export function getLocalGoals(): typeof MOCK_GOALS {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(GOALS_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveLocalGoal(goal: typeof MOCK_GOALS[0]) {
  const existing = getLocalGoals()
  existing.push(goal)
  localStorage.setItem(GOALS_KEY, JSON.stringify(existing))
}

export function updateLocalGoal(id: string, updates: Partial<typeof MOCK_GOALS[0]>) {
  const existing = getLocalGoals().map(g => g.id === id ? { ...g, ...updates } : g)
  localStorage.setItem(GOALS_KEY, JSON.stringify(existing))
}

export function deleteLocalGoal(id: string) {
  const existing = getLocalGoals().filter(g => g.id !== id)
  localStorage.setItem(GOALS_KEY, JSON.stringify(existing))
}
