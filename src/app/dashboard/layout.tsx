import DashboardLayout from '@/components/stitch/DashboardLayout'

export default function RootDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
