import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface CategoryCardProps {
  id: string
  name: string
  image: string
  imageAlt: string
  productCount: number
  className?: string
  priority?: boolean
}

export default function CategoryCard({
  id,
  name,
  image,
  imageAlt,
  productCount,
  className,
  priority = false,
}: CategoryCardProps) {
  const countLabel = `${productCount} Product${productCount === 1 ? '' : 's'}`

  return (
    <Link
      href={`/category/${id}`}
      aria-label={`Browse ${name}, ${countLabel}`}
      className={cn(
        'group block cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B87333] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2]',
        className,
      )}
    >
      <article className="flex h-full flex-col">
        <div
          className={cn(
            'relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-xl bg-[#FAF7F2]',
            'motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out',
            'motion-safe:group-hover:scale-[1.02]',
          )}
        >
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority={priority}
            quality={85}
            draggable={false}
            className="object-cover"
            sizes="(max-width: 1023px) 76vw, 25vw"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center pt-2.5">
          <h3
            className={cn(
              'line-clamp-2 text-sm font-semibold leading-snug text-stone-900 sm:text-base',
              'motion-safe:transition-colors motion-safe:duration-200',
              'motion-safe:group-hover:text-[#B87333]',
            )}
          >
            {name}
          </h3>
          <p className="mt-0.5 text-xs text-stone-500 sm:text-sm">{countLabel}</p>
        </div>
      </article>
    </Link>
  )
}
