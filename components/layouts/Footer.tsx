import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import type { NavCategory } from '@/lib/category-types'
import {
  FOOTER_ADDRESS,
  FOOTER_BRAND_TAGLINE,
  FOOTER_POLICY_LINKS,
  FOOTER_QUICK_LINKS,
  FOOTER_SOCIAL,
} from '@/lib/footer-content'
import FooterMobileNav from '@/components/layouts/FooterMobileNav'

type FooterProps = {
  navCategories: NavCategory[]
  storeName: string
  storeEmail: string
  storePhone: string
}

const desktopLinkClass =
  'text-sm hover:text-[#B87333] transition-colors duration-200 block py-1'

function FooterSocial() {
  const iconMap = {
    facebook: Facebook,
    instagram: Instagram,
    whatsapp: FaWhatsapp,
  } as const

  return (
    <div className="flex flex-wrap gap-2.5">
      {FOOTER_SOCIAL.map((social) => {
        const Icon = iconMap[social.icon]
        return (
          <a
            key={social.href}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            className="rounded-full bg-stone-800/80 p-2 text-stone-300 transition-colors duration-200 hover:bg-[#B87333] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B87333] focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
          >
            <Icon className="h-4 w-4" aria-hidden />
          </a>
        )
      })}
    </div>
  )
}

function FooterBrand({
  storeName,
  compact = false,
}: {
  storeName: string
  compact?: boolean
}) {
  return (
    <div className={compact ? 'mb-4' : undefined}>
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B87333] focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 rounded-sm"
      >
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white">
          <Image
            src="https://res.cloudinary.com/dfocwbzzo/image/upload/v1763995872/ZESCOH_LOGO_o7pz0s.jpg"
            alt={`${storeName} logo`}
            fill
            sizes="32px"
            className="object-cover"
          />
        </div>
        <span className="text-base font-semibold text-stone-50 sm:text-lg">
          {storeName}
        </span>
      </Link>
      <p
        className={
          compact
            ? 'mb-4 text-sm leading-snug text-stone-400'
            : 'mb-6 text-sm leading-relaxed text-stone-400'
        }
      >
        {FOOTER_BRAND_TAGLINE}
      </p>
      <FooterSocial />
    </div>
  )
}

export default function Footer({
  navCategories,
  storeName,
  storeEmail,
  storePhone,
}: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-stone-800 bg-stone-950 text-stone-300">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-12">
        <div className="lg:hidden">
          <FooterBrand storeName={storeName} compact />
          <FooterMobileNav
            navCategories={navCategories}
            storeEmail={storeEmail}
            storePhone={storePhone}
          />
        </div>

        <div className="hidden lg:grid lg:grid-cols-5 lg:gap-8">
          <div>
            <FooterBrand storeName={storeName} />
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-100">
              Categories
            </h3>
            <ul className="space-y-1">
              {navCategories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/category/${category.slug}`}
                    className={desktopLinkClass}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-100">
              Quick Links
            </h3>
            <ul className="space-y-1">
              {FOOTER_QUICK_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={desktopLinkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-100">
              Policies
            </h3>
            <ul className="space-y-1">
              {FOOTER_POLICY_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={desktopLinkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-100">
              Contact
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2.5">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#B87333]"
                  aria-hidden
                />
                <span className="leading-relaxed">{FOOTER_ADDRESS}</span>
              </li>
              {storePhone ? (
                <li className="flex gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-[#B87333]" aria-hidden />
                  <a href={`tel:${storePhone.replace(/\s/g, '')}`} className="hover:text-[#B87333]">
                    {storePhone}
                  </a>
                </li>
              ) : null}
              {storeEmail ? (
                <li className="flex gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-[#B87333]" aria-hidden />
                  <a
                    href={`mailto:${storeEmail}`}
                    className="break-all hover:text-[#B87333]"
                  >
                    {storeEmail}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-6 border-t border-stone-800 pt-5 text-center text-xs text-stone-500 lg:mt-10 lg:pt-8 lg:text-sm">
          <p>
            &copy; {currentYear} {storeName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
