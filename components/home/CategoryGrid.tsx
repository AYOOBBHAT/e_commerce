import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { PRODUCT_CATEGORIES } from '@/lib/constants'

const categoryData = [
  {
    ...PRODUCT_CATEGORIES[0], // Healthy Handmade
    image:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/c_fill,ar_1:1,f_auto,q_auto/v1759654486/handmade_healthy_bites_1-1_zf5dhi.png',
  },
  {
    ...PRODUCT_CATEGORIES[1], // Customised Handmade
    image:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/c_fill,ar_1:1,f_auto,q_auto/v1759654138/customised_1-1_aykhal.png',
  },
  {
    ...PRODUCT_CATEGORIES[2], // Kashmiri Delights
    image:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/c_fill,ar_1:1,f_auto,q_auto/v1759648422/1000_1000_delights_rlz3k5.png',
  },
  {
    ...PRODUCT_CATEGORIES[3], // Seeds
    image:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/c_fill,ar_1:1,f_auto,q_auto/v1759648607/seeds_1000_1000_pa7qn7.png',
  },
  {
    ...PRODUCT_CATEGORIES[4], // Spices
    image:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/c_fill,ar_1:1,f_auto,q_auto/v1759653046/spices_1-1_yiyt3i.png',
  },
  {
    ...PRODUCT_CATEGORIES[5], // Farm Fresh
    image:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/c_fill,ar_1:1,f_auto,q_auto/v1759653567/1-1_farm_fresh_g9yavk.png',
  },
]


export default function CategoryGrid() {
  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-500 mb-2">
            Discover goodness
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
            Shop by Category
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto mt-2">
            Explore handmade treats, pantry staples, and regional delights curated by artisans.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categoryData.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.id}`}
              className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-3 sm:p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {/* Image Container */}
              <div className="relative rounded-2xl overflow-hidden aspect-square w-full bg-emerald-50/30">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-contain p-4 transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw,
                         (max-width: 1024px) 50vw,
                         (max-width: 1280px) 33vw,
                         25vw"
                  priority={false}
                />
              </div>

              {/* Category Label */}
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-emerald-600 transition">
                    {category.name}
                  </h3>
                  <p className="text-xs text-slate-500">Shop collection</p>
                </div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-200 transition">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
