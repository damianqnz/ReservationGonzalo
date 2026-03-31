'use client'

import { useState, useEffect } from 'react'
import DashboardSidebar from './DashboardSidebar'
import DashboardTopbar from './DashboardTopbar'

interface DashboardLayoutProps {
  children:             React.ReactNode
  unreadCount?:         number
  pendingReviewsCount?: number
  userName?:            string
}

export default function DashboardLayout({ 
  children, 
  unreadCount = 0, 
  pendingReviewsCount = 0,
  userName 
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  // Restore from localStorage on mount
  useEffect(() => {
    setCollapsed(localStorage.getItem('rg-sidebar-collapsed') === 'true')
  }, [])

  function toggleSidebar() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('rg-sidebar-collapsed', String(next))
  }

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <DashboardSidebar 
        collapsed={collapsed} 
        onToggle={toggleSidebar} 
        unreadCount={unreadCount} 
        pendingReviewsCount={pendingReviewsCount}
      />

      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? 'pl-16' : 'pl-64'
        }`}
      >
        <DashboardTopbar unreadCount={unreadCount} collapsed={collapsed} />
        <main className="flex-1 mt-16 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
