/**
 * 네비게이션 메뉴
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Activity, Settings } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()

  const menuItems = [
    {
      name: '회계보드',
      path: '/',
      icon: Home
    },
    {
      name: '법인 추가 과정',
      path: '/progress',
      icon: Activity
    },
    {
      name: '설정',
      path: '/settings',
      icon: Settings
    }
  ]

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
