'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
    )
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <button
        onClick={() => setTheme('light')}
        className={`flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200 ${
          theme === 'light'
            ? 'bg-white dark:bg-gray-700 text-yellow-600 shadow-sm scale-105'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
        }`}
        aria-label="Light mode"
        title="라이트 모드"
      >
        <Sun className="w-4 h-4" />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm scale-105'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
        }`}
        aria-label="Dark mode"
        title="다크 모드"
      >
        <Moon className="w-4 h-4" />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200 ${
          theme === 'system'
            ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm scale-105'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
        }`}
        aria-label="System theme"
        title="시스템 설정"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  )
}
