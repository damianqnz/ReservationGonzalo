import { Suspense } from 'react'
import Navbar from '@/components/stitch/Navbar'
import LoginScreen from '@/components/stitch/LoginScreen'

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
