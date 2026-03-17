import DashboardSidebar from './DashboardSidebar'
import DashboardTopbar from './DashboardTopbar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <DashboardSidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <DashboardTopbar />
        <main className="flex-1 mt-16 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
