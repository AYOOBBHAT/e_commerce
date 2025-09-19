import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { PRODUCT_CATEGORIES } from '@/lib/constants'

const categoryData = [
  {
    ...PRODUCT_CATEGORIES[0],
    image:
      'https://res.cloudinary.com/dksecqzvv/image/upload/c_fill,ar_1:1/v1758087751/new_img_s4rv89.png',
  },
  {
    ...PRODUCT_CATEGORIES[2],
    image:
      'https://res.cloudinary.com/dksecqzvv/image/upload/c_fill,ar_1:1/v1758087751/new_img_s4rv89.png',
  },
  {
    ...PRODUCT_CATEGORIES[1],
    image:
      'https://res.cloudinary.com/dksecqzvv/image/upload/c_fill,ar_1:1/v1758087751/new_img_s4rv89.png',
  },
  {
    ...PRODUCT_CATEGORIES[3],
    image:
      'https://res.cloudinary.com/dksecqzvv/image/upload/c_fill,ar_1:1/v1758087751/new_img_s4rv89.png',
  },
  {
    ...PRODUCT_CATEGORIES[5],
    image:
      'https://res.cloudinary.com/dksecqzvv/image/upload/c_fill,ar_1:1/v1758087751/new_img_s4rv89.png',
  },
  {
    ...PRODUCT_CATEGORIES[4],
    image:
      'https://res.cloudinary.com/dksecqzvv/image/upload/c_fill,ar_1:1/v1758087751/new_img_s4rv89.png',
  },
]

export default function CategoryGrid() {
  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-white">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="text-center mb-6 sm:mb-10 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">
            Shop by Category
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categoryData.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.id}`}
              className="group relative rounded-xl overflow-hidden aspect-square w-full shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95"
            >
              {/* Image */}
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-contain p-4 bg-white"
                sizes="(max-width: 640px) 100vw,
                       (max-width: 1024px) 50vw,
                       (max-width: 1280px) 33vw,
                       25vw"
              />

              {/* Overlay gradient for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

              {/* Category Label */}
              <div className="absolute bottom-4 left-4 right-4">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white text-black text-sm font-semibold shadow-md group-hover:bg-black group-hover:text-white transition-all duration-300 line-clamp-2">
                  {category.name}
                  <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
