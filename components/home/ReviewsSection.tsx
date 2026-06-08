import Link from 'next/link'
import type { ProductReviewEntry } from '@/lib/actions/products'
import { getStarString } from '@/lib/product-display'

interface ReviewsSectionProps {
  reviews: ProductReviewEntry[]
}

export default function ReviewsSection({ reviews }: ReviewsSectionProps) {
  if (!reviews.length) return null

  return (
    <section
      className="border-t border-stone-200/80 bg-white py-10 sm:py-14 lg:py-16"
      aria-labelledby="reviews-section-heading"
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 sm:mb-8">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B87333]">
            Customer Reviews
          </p>
          <h2
            id="reviews-section-heading"
            className="text-xl font-bold text-stone-900 sm:text-2xl"
          >
            What Our Customers Say
          </h2>
        </header>

        <ul className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {reviews.map((entry, index) => (
            <li
              key={`${entry.productSlug}-${index}`}
              className="flex flex-col rounded-xl border border-stone-100 bg-[#FAF7F2]/50 p-4 sm:p-5"
            >
              <p
                className="text-sm leading-relaxed text-stone-700"
                aria-label={`${entry.rating} out of 5 stars`}
              >
                <span className="mr-2 text-amber-600" aria-hidden>
                  {getStarString(entry.rating)}
                </span>
                &ldquo;{entry.review}&rdquo;
              </p>
              <Link
                href={`/products/${entry.productSlug}`}
                className="mt-3 text-sm font-semibold text-stone-900 hover:text-[#B87333]"
              >
                {entry.productName}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
