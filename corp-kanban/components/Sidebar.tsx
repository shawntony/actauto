/**
 * 사이드바 네비게이션 컴포넌트
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Layout, PlusCircle, Settings, Menu, X } from 'lucide-react'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'

const menuItems = [
  {
    name: '회계보드',
    href: '/',
    icon: Layout
  },
  {
    name: '법인 추가 과정',
    href: '/progress',
    icon: PlusCircle
  },
  {
    name: '설정',
    href: '/settings',
    icon: Settings
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-900 dark:text-gray-100" />
        ) : (
          <Menu className="w-6 h-6 text-gray-900 dark:text-gray-100" />
        )}
      </button>

      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64
          bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          shadow-lg z-40
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* 로고 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">법인 관리</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">시스템</p>
            </div>
          </div>
        </div>

        {/* 메뉴 */}
        <nav className="p-4 space-y-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium shadow-md scale-105'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-102'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* 테마 토글 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">테마 설정</p>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  )
}
