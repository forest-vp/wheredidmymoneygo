'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

interface QuizData {
  // Housing
  rentMortgage: string
  utilities: string
  internet: string
  phoneBill: string
  // Transport
  hasCar: 'yes' | 'no' | ''
  carType: 'electric' | 'hybrid' | 'petrol' | 'diesel' | ''
  fuelWeekly: string
  publicTransportWeekly: string
  // Food
  groceriesWeekly: string
  eatingOutWeekly: string
  coffeeWeekly: string
  // Subscriptions
  netflix: '' | 'yes'
  spotify: '' | 'yes'
  amazon: '' | 'yes'
  otherSubscriptionMonthly: string
  // Habits
  smoking: '' | 'yes'
  cigarettesPerDay: string
  alcoholWeekly: string
  gamblingMonthly: string
  gamingMonthly: string
  // Shopping
  clothingMonthly: string
  amazonShoppingMonthly: string
  // Health
  gymMonthly: string
  healthInsuranceMonthly: string
  // Entertainment
  cinemaMonthly: string
  eventsMonthly: string
  // Travel
  holidaysPerYear: string
  // Income
  monthlySalary: string
  additionalIncome: string
}

const defaultQuiz: QuizData = {
  rentMortgage: '', utilities: '', internet: '', phoneBill: '',
  hasCar: '', carType: '', fuelWeekly: '', publicTransportWeekly: '',
  groceriesWeekly: '', eatingOutWeekly: '', coffeeWeekly: '',
  netflix: '', spotify: '', amazon: '', otherSubscriptionMonthly: '',
  smoking: '', cigarettesPerDay: '', alcoholWeekly: '', gamblingMonthly: '', gamingMonthly: '',
  clothingMonthly: '', amazonShoppingMonthly: '',
  gymMonthly: '', healthInsuranceMonthly: '',
  cinemaMonthly: '', eventsMonthly: '',
  holidaysPerYear: '',
  monthlySalary: '', additionalIncome: '',
}

interface QuestionConfig {
  key: keyof QuizData
  question: string
  subtitle: string
  type: 'number' | 'select' | 'frequency'
  options?: { value: string; label: string }[]
  placeholder?: string
  prefix?: string
  emoji: string
}

const QUIZ_SECTIONS = [
  {
    title: '🏠 Housing & Bills',
    description: 'Tell us about your living expenses',
    questions: [
      { key: 'rentMortgage', question: 'Rent / Mortgage', subtitle: 'Monthly payment', type: 'number' as const, placeholder: '800', prefix: '€', emoji: '🏠' },
      { key: 'utilities', question: 'Electricity, Water, Gas', subtitle: 'Average monthly bill', type: 'number' as const, placeholder: '120', prefix: '€', emoji: '⚡' },
      { key: 'internet', question: 'Internet', subtitle: 'Monthly cost', type: 'number' as const, placeholder: '30', prefix: '€', emoji: '🌐' },
      { key: 'phoneBill', question: 'Phone Bill', subtitle: 'Monthly cost', type: 'number' as const, placeholder: '20', prefix: '€', emoji: '📱' },
    ] as QuestionConfig[],
  },
  {
    title: '🚗 Transport',
    description: 'How do you get around?',
    questions: [
      { key: 'hasCar', question: 'Do you own a car?', subtitle: '', type: 'select' as const, options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No, I use public transport' }], emoji: '🚗' },
      { key: 'fuelWeekly', question: 'Fuel per week', subtitle: 'How much do you spend on fuel?', type: 'number' as const, placeholder: '40', prefix: '€', emoji: '⛽' },
      { key: 'publicTransportWeekly', question: 'Public transport per week', subtitle: 'Bus, train, metro, taxi', type: 'number' as const, placeholder: '15', prefix: '€', emoji: '🚌' },
    ] as QuestionConfig[],
  },
  {
    title: '🍕 Food & Drinks',
    description: 'What do you spend on food?',
    questions: [
      { key: 'groceriesWeekly', question: 'Groceries per week', subtitle: 'Food shopping for home', type: 'number' as const, placeholder: '60', prefix: '€', emoji: '🛒' },
      { key: 'eatingOutWeekly', question: 'Eating out per week', subtitle: 'Restaurants, takeaway, delivery', type: 'number' as const, placeholder: '30', prefix: '€', emoji: '🍽️' },
      { key: 'coffeeWeekly', question: 'Coffee per week', subtitle: 'Cafes, not home-made', type: 'number' as const, placeholder: '10', prefix: '€', emoji: '☕' },
    ] as QuestionConfig[],
  },
  {
    title: '📱 Subscriptions',
    description: 'What subscriptions do you have?',
    questions: [
      { key: 'netflix', question: 'Netflix', subtitle: 'Do you have a Netflix subscription?', type: 'select' as const, options: [{ value: 'yes', label: 'Yes (€15.99/mo)' }, { value: '', label: 'No' }], emoji: '🎬' },
      { key: 'spotify', question: 'Spotify', subtitle: 'Do you have Spotify?', type: 'select' as const, options: [{ value: 'yes', label: 'Yes (€9.99/mo)' }, { value: '', label: 'No' }], emoji: '🎵' },
      { key: 'amazon', question: 'Amazon Prime', subtitle: 'Do you have Amazon Prime?', type: 'select' as const, options: [{ value: 'yes', label: 'Yes' }, { value: '', label: 'No' }], emoji: '📦' },
      { key: 'otherSubscriptionMonthly', question: 'Other subscriptions', subtitle: 'Gym, apps, software, etc.', type: 'number' as const, placeholder: '0', prefix: '€', emoji: '📋' },
    ] as QuestionConfig[],
  },
  {
    title: '🚬 Habits & Vices',
    description: 'Be honest — we won\'t judge',
    questions: [
      { key: 'smoking', question: 'Do you smoke?', subtitle: '', type: 'select' as const, options: [{ value: 'yes', label: 'Yes' }, { value: '', label: 'No' }], emoji: '🚬' },
      { key: 'cigarettesPerDay', question: 'Cigarettes per day', subtitle: 'How many cigarettes?', type: 'number' as const, placeholder: '10', emoji: '🚬' },
      { key: 'alcoholWeekly', question: 'Alcohol per week', subtitle: 'Beer, wine, cocktails, etc.', type: 'number' as const, placeholder: '15', prefix: '€', emoji: '🍺' },
      { key: 'gamblingMonthly', question: 'Gambling per month', subtitle: 'Betting, lottery, casino', type: 'number' as const, placeholder: '0', prefix: '€', emoji: '🎰' },
      { key: 'gamingMonthly', question: 'Gaming per month', subtitle: 'Games, in-game purchases', type: 'number' as const, placeholder: '0', prefix: '€', emoji: '🎮' },
    ] as QuestionConfig[],
  },
  {
    title: '🛍️ Shopping',
    description: 'How much do you spend on shopping?',
    questions: [
      { key: 'clothingMonthly', question: 'Clothing & Shoes', subtitle: 'Monthly average', type: 'number' as const, placeholder: '50', prefix: '€', emoji: '👕' },
      { key: 'amazonShoppingMonthly', question: 'Online shopping', subtitle: 'Amazon, Zalando, etc.', type: 'number' as const, placeholder: '30', prefix: '€', emoji: '📦' },
    ] as QuestionConfig[],
  },
  {
    title: '💪 Health & Fitness',
    description: 'Your health expenses',
    questions: [
      { key: 'gymMonthly', question: 'Gym / Fitness', subtitle: 'Monthly membership', type: 'number' as const, placeholder: '30', prefix: '€', emoji: '💪' },
      { key: 'healthInsuranceMonthly', question: 'Health Insurance', subtitle: 'Monthly premium', type: 'number' as const, placeholder: '0', prefix: '€', emoji: '🏥' },
    ] as QuestionConfig[],
  },
  {
    title: '🎉 Entertainment & Travel',
    description: 'Fun and travel expenses',
    questions: [
      { key: 'cinemaMonthly', question: 'Cinema / Events', subtitle: 'Monthly average', type: 'number' as const, placeholder: '15', prefix: '€', emoji: '🎬' },
      { key: 'eventsMonthly', question: 'Concerts / Events', subtitle: 'Monthly average', type: 'number' as const, placeholder: '20', prefix: '€', emoji: '🎵' },
      { key: 'holidaysPerYear', question: 'Holidays per year', subtitle: 'How many trips?', type: 'number' as const, placeholder: '2', emoji: '✈️' },
    ] as QuestionConfig[],
  },
  {
    title: '💰 Income',
    description: 'Finally, tell us about your income',
    questions: [
      { key: 'monthlySalary', question: 'Monthly Salary (after tax)', subtitle: 'Your take-home pay', type: 'number' as const, placeholder: '2000', prefix: '€', emoji: '💰' },
      { key: 'additionalIncome', question: 'Additional Income', subtitle: 'Side jobs, freelance, investments', type: 'number' as const, placeholder: '0', prefix: '€', emoji: '📈' },
    ] as QuestionConfig[],
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [sectionIdx, setSectionIdx] = useState(0)
  const [questionIdx, setQuestionIdx] = useState(0)
  const [quiz, setQuiz] = useState<QuizData>(defaultQuiz)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [calculatedExpenses, setCalculatedExpenses] = useState<Record<string, number>>({})

  const section = QUIZ_SECTIONS[sectionIdx]
  const question = section?.questions[questionIdx]
  const totalQuestions = QUIZ_SECTIONS.reduce((sum, s) => sum + s.questions.length, 0)
  const currentQuestionNum = QUIZ_SECTIONS.slice(0, sectionIdx).reduce((sum, s) => sum + s.questions.length, 0) + questionIdx + 1

  const progress = Math.round((currentQuestionNum / totalQuestions) * 100)

  const updateAnswer = (value: string) => {
    setQuiz(prev => ({ ...prev, [question.key]: value }))
  }

  const handleNext = () => {
    if (questionIdx < section.questions.length - 1) {
      setQuestionIdx(prev => prev + 1)
    } else if (sectionIdx < QUIZ_SECTIONS.length - 1) {
      setSectionIdx(prev => prev + 1)
      setQuestionIdx(0)
    } else {
      calculateAndShowResults()
    }
  }

  const handleBack = () => {
    if (questionIdx > 0) {
      setQuestionIdx(prev => prev - 1)
    } else if (sectionIdx > 0) {
      setSectionIdx(prev => prev - 1)
      setQuestionIdx(QUIZ_SECTIONS[sectionIdx - 1].questions.length - 1)
    }
  }

  const calculateAndShowResults = () => {
    const q = quiz
    const expenses: Record<string, number> = {}

    // Housing (monthly)
    expenses['Rent/Mortgage'] = parseFloat(q.rentMortgage) || 0
    expenses['Utilities'] = parseFloat(q.utilities) || 0
    expenses['Internet'] = parseFloat(q.internet) || 0
    expenses['Phone'] = parseFloat(q.phoneBill) || 0

    // Transport (monthly)
    expenses['Fuel'] = (parseFloat(q.fuelWeekly) || 0) * 4.3
    expenses['Public Transport'] = (parseFloat(q.publicTransportWeekly) || 0) * 4.3

    // Food (monthly)
    expenses['Groceries'] = (parseFloat(q.groceriesWeekly) || 0) * 4.3
    expenses['Eating Out'] = (parseFloat(q.eatingOutWeekly) || 0) * 4.3
    expenses['Coffee'] = (parseFloat(q.coffeeWeekly) || 0) * 4.3

    // Subscriptions (monthly)
    expenses['Netflix'] = q.netflix === 'yes' ? 15.99 : 0
    expenses['Spotify'] = q.spotify === 'yes' ? 9.99 : 0
    expenses['Amazon Prime'] = q.amazon === 'yes' ? 4.99 : 0
    expenses['Other Subscriptions'] = parseFloat(q.otherSubscriptionMonthly) || 0

    // Habits (monthly)
    expenses['Smoking'] = q.smoking === 'yes' ? (parseFloat(q.cigarettesPerDay) || 0) * 0.35 * 30 : 0
    expenses['Alcohol'] = (parseFloat(q.alcoholWeekly) || 0) * 4.3
    expenses['Gambling'] = parseFloat(q.gamblingMonthly) || 0
    expenses['Gaming'] = parseFloat(q.gamingMonthly) || 0

    // Shopping (monthly)
    expenses['Clothing'] = parseFloat(q.clothingMonthly) || 0
    expenses['Online Shopping'] = parseFloat(q.amazonShoppingMonthly) || 0

    // Health (monthly)
    expenses['Gym'] = parseFloat(q.gymMonthly) || 0
    expenses['Health Insurance'] = parseFloat(q.healthInsuranceMonthly) || 0

    // Entertainment (monthly)
    expenses['Cinema/Events'] = parseFloat(q.cinemaMonthly) || 0
    expenses['Events/Concerts'] = parseFloat(q.eventsMonthly) || 0

    // Travel (monthly)
    expenses['Holidays'] = ((parseFloat(q.holidaysPerYear) || 0) * 800) / 12

    const totalMonthly = Object.values(expenses).reduce((a, b) => a + b, 0)
    const salary = parseFloat(q.monthlySalary) || 0
    const additional = parseFloat(q.additionalIncome) || 0
    const totalIncome = salary + additional

    setCalculatedExpenses({ ...expenses, _total: totalMonthly, _income: totalIncome, _leftover: totalIncome - totalMonthly })
    setShowResults(true)
  }

  const handleFinishOnboarding = async () => {
    setLoading(true)
    const supabase = getSupabase()
    if (!supabase) { setLoading(false); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Save onboarding data
    await supabase.from('profiles').update({
      onboarding_complete: true,
      onboarding_data: quiz as unknown as Record<string, unknown>,
      monthly_salary: parseFloat(quiz.monthlySalary) || 0,
    }).eq('id', user.id)

    // Save estimated expenses to database
    const expenseEntries = Object.entries(calculatedExpenses)
      .filter(([key]) => !key.startsWith('_') && calculatedExpenses[key] > 0)
      .map(([name, amount]) => ({
        user_id: user.id,
        name,
        category: name.toLowerCase().includes('rent') || name.toLowerCase().includes('mortgage') ? 'housing' :
                  name.toLowerCase().includes('fuel') || name.toLowerCase().includes('transport') ? 'transport' :
                  name.toLowerCase().includes('grocery') || name.toLowerCase().includes('food') || name.toLowerCase().includes('coffee') ? 'food' :
                  name.toLowerCase().includes('netflix') || name.toLowerCase().includes('spotify') || name.toLowerCase().includes('subscription') ? 'subscriptions' :
                  name.toLowerCase().includes('smoking') || name.toLowerCase().includes('alcohol') || name.toLowerCase().includes('gambling') ? 'habits' :
                  name.toLowerCase().includes('gym') || name.toLowerCase().includes('health') ? 'health' : 'other',
        amount: Math.round(amount * 100) / 100,
        frequency: 'monthly',
        is_estimated: true,
      }))

    if (expenseEntries.length > 0) {
      await supabase.from('expenses').insert(expenseEntries)
    }

    router.push('/dashboard')
  }

  if (showResults) {
    const total = calculatedExpenses._total || 0
    const income = calculatedExpenses._income || 0
    const leftover = calculatedExpenses._leftover || 0
    const sortedExpenses = Object.entries(calculatedExpenses)
      .filter(([key]) => !key.startsWith('_'))
      .sort((a, b) => b[1] - a[1])

    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-2xl relative z-10 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent font-medium">Your Spending Analysis</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Here&apos;s where your money goes</h1>
            <p className="text-text-muted">Based on your answers, this is your estimated monthly spending</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-5 text-center">
              <p className="text-text-muted text-xs mb-1">Monthly Income</p>
              <p className="text-2xl font-bold text-accent">€{income.toFixed(0)}</p>
            </div>
            <div className="glass-card rounded-2xl p-5 text-center">
              <p className="text-text-muted text-xs mb-1">Monthly Spending</p>
              <p className="text-2xl font-bold text-danger">€{total.toFixed(0)}</p>
            </div>
            <div className="glass-card rounded-2xl p-5 text-center">
              <p className="text-text-muted text-xs mb-1">Left Over</p>
              <p className={`text-2xl font-bold ${leftover >= 0 ? 'text-accent' : 'text-danger'}`}>€{leftover.toFixed(0)}</p>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Spending Breakdown</h2>
            <div className="space-y-3">
              {sortedExpenses.map(([name, amount]) => {
                const pct = total > 0 ? (amount / total) * 100 : 0
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-text-muted">{name}</span>
                      <span className="font-medium">€{amount.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-bg rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Plan Recommendation */}
          <div className="glass-card rounded-2xl p-6 border-primary/20">
            <h2 className="font-semibold mb-2">💡 Recommended Plan</h2>
            {leftover < 100 ? (
              <div>
                <p className="text-text-muted text-sm mb-3">
                  You&apos;re spending almost all your income. Our <span className="text-accent font-semibold">Premium plan</span> with Reality Mode
                  will help you identify money leaks and build better habits.
                </p>
                <div className="flex gap-3">
                  <button onClick={handleFinishOnboarding} disabled={loading}
                    className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? 'Saving...' : 'Start with Free'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                  <button onClick={() => router.push('/pricing')} disabled={loading}
                    className="px-6 border border-accent/30 text-accent hover:bg-accent/10 py-3 rounded-xl font-medium transition-all">
                    See Pro/Premium
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-text-muted text-sm mb-3">
                  You have €{leftover.toFixed(0)} left each month. Our <span className="text-primary font-semibold">Pro plan</span> will help you
                  understand your habits and reach your goals faster.
                </p>
                <div className="flex gap-3">
                  <button onClick={handleFinishOnboarding} disabled={loading}
                    className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? 'Saving...' : 'Start with Free'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                  <button onClick={() => router.push('/pricing')} disabled={loading}
                    className="px-6 border border-accent/30 text-accent hover:bg-accent/10 py-3 rounded-xl font-medium transition-all">
                    See Pro/Premium
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-12">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm text-text-muted mb-2">
            <span>{section?.title}</span>
            <span>{currentQuestionNum} / {totalQuestions}</span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question Card */}
        <div className="glass-card rounded-2xl p-8">
          <div className="text-4xl mb-4">{question?.emoji}</div>
          <h2 className="text-xl font-bold mb-1">{question?.question}</h2>
          {question?.subtitle && <p className="text-text-muted text-sm mb-6">{question.subtitle}</p>}

          {question?.type === 'number' && (
            <div className="relative">
              {question.prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim text-lg">{question.prefix}</span>}
              <input
                type="number"
                min="0"
                step="0.01"
                value={quiz[question.key] as string}
                onChange={(e) => updateAnswer(e.target.value)}
                placeholder={question.placeholder}
                className={`w-full bg-bg border border-border rounded-xl ${question.prefix ? 'pl-10' : 'pl-4'} pr-4 py-4 text-text text-lg placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors`}
                autoFocus
              />
            </div>
          )}

          {question?.type === 'select' && question.options && (
            <div className="space-y-3">
              {question.options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateAnswer(opt.value)}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                    quiz[question.key] === opt.value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-bg border-border text-text-muted hover:border-border-light hover:text-text'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <button onClick={handleBack} disabled={sectionIdx === 0 && questionIdx === 0}
              className="px-6 border border-border text-text-muted hover:text-text py-3 rounded-xl font-medium transition-all disabled:opacity-30">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={handleNext}
              className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
              {sectionIdx === QUIZ_SECTIONS.length - 1 && questionIdx === section.questions.length - 1 ? 'See Results' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-center text-text-dim text-xs">
          Your data is stored securely and never shared.
        </p>
      </div>
    </div>
  )
}
