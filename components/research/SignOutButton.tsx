'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/family/login' })}
      className="text-sm text-slate-500 hover:text-slate-800 hover:underline"
    >
      Đăng xuất
    </button>
  )
}
