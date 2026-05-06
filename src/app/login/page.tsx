import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import LoginScreen from '@/components/auth/LoginScreen'

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
