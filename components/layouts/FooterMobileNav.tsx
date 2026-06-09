'use client'

import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  FOOTER_ADDRESS,
  FOOTER_POLICY_LINKS,
  FOOTER_QUICK_LINKS,
} from '@/lib/footer-content'
import type { NavCategory } from '@/lib/category-types'

type FooterMobileNavProps = {
  navCategories: NavCategory[]
  storeEmail: string
  storePhone: string
}

const linkClass =
  'block py-2 text-sm text-stone-300 transition-colors hover:text-[#B87333] focus-visible:outline-none focus-visible:text-[#B87333]'

const triggerClass =
  'py-3.5 text-sm font-semibold text-stone-100 hover:no-underline [&[data-state=open]>svg]:text-[#B87333]'

export default function FooterMobileNav({
  navCategories,
  storeEmail,
  storePhone,
}: FooterMobileNavProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-stone-800 border-t border-stone-800 lg:hidden"
    >
      <AccordionItem value="categories" className="border-0">
        <AccordionTrigger className={triggerClass}>
          Categories
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-0">
          <ul className="space-y-0.5">
            {navCategories.map((category) => (
              <li key={category.slug}>
                <Link href={`/category/${category.slug}`} className={linkClass}>
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="quick-links" className="border-0">
        <AccordionTrigger className={triggerClass}>
          Quick Links
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-0">
          <ul className="space-y-0.5">
            {FOOTER_QUICK_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="policies" className="border-0">
        <AccordionTrigger className={triggerClass}>
          Policies
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-0">
          <ul className="space-y-0.5">
            {FOOTER_POLICY_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="contact" className="border-0">
        <AccordionTrigger className={triggerClass}>
          Contact
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-0">
          <ul className="space-y-3 text-sm text-stone-300">
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
