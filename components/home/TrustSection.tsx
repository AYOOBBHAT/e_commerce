import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import TrustEditorialImage from '@/components/home/TrustEditorialImage'
import {
  TRUST_PILLARS,
  TRUST_PROOF_SIGNALS,
  TRUST_SECTION_COPY,
  type TrustPillar,
} from '@/lib/trust-content'

function TrustPillarRow({ pillar }: { pillar: TrustPillar }) {
  const Icon = pillar.icon

  return (
    <div className="flex gap-3.5 border-b border-stone-100 py-5 last:border-0 sm:gap-4 sm:py-6">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FAF7F2]">
        <Icon className="h-4 w-4 text-[#B87333]" aria-hidden />
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-semibold leading-snug text-stone-900">
          {pillar.title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">
          {pillar.description}
        </p>
      </div>
    </div>
  )
}

export default function TrustSection() {
  const copy = TRUST_SECTION_COPY

  return (
    <section
      className="border-t border-[#B87333]/25 bg-white py-14 sm:py-16 lg:py-20"
      aria-labelledby="trust-section-heading"
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ul
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[11px] font-medium text-stone-600 sm:justify-start sm:text-xs"
          aria-label="Brand standards"
        >
          {TRUST_PROOF_SIGNALS.map((signal, index) => (
            <li key={signal} className="inline-flex items-center">
              {index > 0 && (
                <span aria-hidden className="mx-2 text-stone-300">
                  ·
                </span>
              )}
              {signal}
            </li>
          ))}
        </ul>

        <header className="mx-auto mt-8 max-w-3xl text-center lg:mx-0 lg:max-w-none lg:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            {copy.eyebrow}
          </p>
          <h2
            id="trust-section-heading"
            className="mt-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl lg:text-4xl"
          >
            {copy.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base">
            {copy.subcopy}
          </p>
        </header>

        <div className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-12">
          <aside className="lg:col-span-5">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#FAF7F2] shadow-sm ring-1 ring-stone-200/80">
              <TrustEditorialImage />
            </div>

            <figure className="mt-6 rounded-2xl border border-stone-100 bg-[#FAF7F2] p-5 sm:p-6">
              <blockquote className="border-l-2 border-[#B87333] pl-4">
                <p className="text-base italic leading-relaxed text-stone-700 sm:text-lg">
                  &ldquo;{copy.quote}&rdquo;
                </p>
              </blockquote>
              <figcaption className="mt-3 pl-4 text-sm text-stone-500">
                {copy.quoteAttribution}
              </figcaption>
            </figure>
          </aside>

          <div className="lg:col-span-7">
            {TRUST_PILLARS.map((pillar) => (
              <TrustPillarRow key={pillar.id} pillar={pillar} />
            ))}

            <p className="mt-6 text-xs leading-relaxed text-stone-500 sm:text-sm">
              {copy.standardsLine}
            </p>

            <Link
              href={copy.storyLink.href}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#B87333] hover:text-stone-900"
            >
              {copy.storyLink.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
