
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'


const categoryData = [
  {
    ...PRODUCT_CATEGORIES[0],
    image:
      'https://res.cloudinary.com/dksecqzvv/image/upload/c_pad,ar_1:1/v1758087751/new_img_s4rv89.png',
  },
  {
    ...PRODUCT_CATEGORIES[2],
    image:
      'https://res.cloudinary.com/dksecqzvv/image/upload/c_pad,ar_1:1/v1758087751/new_img_s4rv89.png',
  },
  {
    ...PRODUCT_CATEGORIES[1],
    image:
      'https://res.cloudinary.com/dksecqzvv/image/upload/c_pad,ar_1:1/v1758087751/new_img_s4rv89.png',
  },
  {
    ...PRODUCT_CATEGORIES[3],
    image:
      'https://res.cloudinary.com/dksecqzvv/image/upload/c_pad,ar_1:1/v1758087751/new_img_s4rv89.png',
  },
  {
    ...PRODUCT_CATEGORIES[5],
    image:
      'https://res.cloudinary.com/dksecqzvv/image/upload/c_pad,ar_1:1/v1758087751/new_img_s4rv89.png',
  },
  {
    ...PRODUCT_CATEGORIES[4],
    image:
      'https://res.cloudinary.com/dksecqzvv/image/upload/c_pad,ar_1:1/v1758087751/new_img_s4rv89.png',
  },
]

export default function CategoryGrid() {
  return (
  <section className="py-8 sm:py-12 lg:py-16 bg-white">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="text-center mb-6 sm:mb-10 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-black bg-white w-full py-2">
            Shop by Category
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {categoryData.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.id}`}
              className="group relative rounded-xl overflow-hidden aspect-[1/1] w-full shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />

  <div className="absolute bottom-4 left-4">
    <Button
      variant="outline"
      size="sm"
      className="w-fit bg-white text-black shadow-md hover:bg-black hover:text-white group-hover:scale-105 transition-all duration-300"
    >
      {category.name}
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  </div>
</Link>

          ))}
        </div>
      </div>
    </section>
  )
}
