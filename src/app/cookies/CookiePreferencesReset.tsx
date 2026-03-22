'use client'

export default function CookiePreferencesReset() {
  function handleReset() {
    localStorage.removeItem('rg-cookie-consent')
    window.location.reload()
  }

  return (
    <button
      onClick={handleReset}
      className="my-3 px-4 py-2 text-sm font-semibold text-[#8b1a1a] border border-[#8b1a1a]/40 rounded-lg hover:bg-[#8b1a1a]/5 transition-colors"
    >
      Redefinir preferências de cookies
    </button>
  )
}
