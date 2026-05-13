import { Suspense } from 'react'
import Navbar from '@/shared/components/layout/Navbar'
import LoginScreen from '@/shared/components/auth/LoginScreen'

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <Suspense>
        <LoginScreen />
      </Suspense>
    </>
  )
}
