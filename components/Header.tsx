'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, Home, BookOpen, RotateCcw, Layers, BarChart3, Upload } from 'lucide-react'

export default function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (isMenuOpen && !target.closest('.header-menu-area')) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/examples', label: 'Examples', icon: BookOpen },
    { href: '/dynamic-examples', label: 'Dynamic', icon: Layers },
    { href: '/review', label: 'Review', icon: RotateCcw },
    { href: '/flashcards', label: 'Flashcards', icon: Layers },
    { href: '/rank', label: 'Ranking', icon: BarChart3 },
    { href: '/custom', label: 'Custom', icon: Upload },
  ]

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12 header-menu-area">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                  isActive(href)
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center justify-between w-full">
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                aria-label="Open menu"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              {isMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <ul className="divide-y divide-gray-100">
                    {navItems.map(({ href, label, icon: Icon }) => (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                            isActive(href)
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon size={16} />
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Current page indicator for mobile */}
            <div className="text-sm font-medium text-gray-600">
              {navItems.find(item => isActive(item.href))?.label || 'Learn Georgian'}
            </div>

            <div className="w-10"></div> {/* Spacer for balance */}
          </div>
        </div>
      </nav>
    </header>
  )
}