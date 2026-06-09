'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Loader2, ShoppingBag } from 'lucide-react'
import { useStorefrontSettings } from '@/components/StorefrontSettingsProvider'
import { cn } from '@/lib/utils'

type AuthShellProps = {
  title: string
  subtitle: string
  children: React.ReactNode
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  const { storeName } = useStorefrontSettings()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-4 h-14 w-14 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <Image
              src="https://res.cloudinary.com/dfocwbzzo/image/upload/v1763995872/ZESCOH_LOGO_o7pz0s.jpg"
              alt={`${storeName} logo`}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B87333]">
            {storeName}
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-stone-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm shadow-stone-900/[0.04] md:p-7">
          {children}
        </div>
      </div>
    </div>
  )
}

export function AuthLoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2] px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2
          className="h-8 w-8 animate-spin text-[#B87333]"
          aria-hidden
        />
        <p className="text-sm text-stone-600">{message}</p>
      </div>
    </div>
  )
}

export const authPrimaryButtonClass =
  'w-full bg-stone-900 text-white hover:bg-stone-800 font-semibold rounded-full h-11'

export const authLinkClass =
  'font-medium text-[#B87333] hover:text-stone-900 transition-colors'

export function GoogleSignInButton() {
  return (
    <a
      href="/api/auth/google"
      className={cn(
        'inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-full',
        'border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700',
        'shadow-sm transition-colors hover:bg-stone-50 hover:border-stone-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B87333] focus-visible:ring-offset-2',
      )}
    >
      <img src="/google-logo.svg" alt="" className="h-5 w-5" aria-hidden />
      Continue with Google
    </a>
  )
}

export function AuthDivider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <span className="w-full border-t border-stone-200" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wide">
        <span className="bg-white px-2 text-stone-400">or</span>
      </div>
    </div>
  )
}

export function AuthFooterLink({
  prompt,
  href,
  label,
}: {
  prompt: string
  href: string
  label: string
}) {
  return (
    <p className="mt-6 text-center text-sm text-stone-500">
      {prompt}{' '}
      <Link href={href} className={authLinkClass}>
        {label}
      </Link>
    </p>
  )
}

/** Legacy icon fallback for pages not yet using logo image */
export function AuthBrandIcon() {
  return (
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#B87333]/30 bg-[#FAF7F2]">
      <ShoppingBag className="h-6 w-6 text-[#B87333]" aria-hidden />
    </div>
  )
}
