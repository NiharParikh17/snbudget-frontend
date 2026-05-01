import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950 text-slate-800 dark:text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-indigo-600 dark:text-indigo-300">
          SNBudget
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          Budget smarter. Split easier.
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          A budgeting app with built-in expense splitting between users.
        </p>

        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          className="mt-10 inline-flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium px-5 py-2.5 transition-colors shadow"
        >
          Clicks: {count}
        </button>
      </div>
    </main>
  )
}

export default App
