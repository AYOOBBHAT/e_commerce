import { getCategoryStats, type CategoryStatsMap } from '@/lib/actions/products'
import { CATEGORY_VISUALS } from '@/lib/category-content'
import CategoryCard from '@/components/home/CategoryCard'
import CategoryCarousel, {
  CATEGORY_CAROUSEL_ITEM_CLASS,
} from '@/components/home/CategoryCarousel'

function resolveCategoryStats(categoryId: string, stats: CategoryStatsMap) {
  return stats[categoryId] ?? { count: 0, fromPrice: null }
}

export default async function CategoryGrid() {
  const stats = await getCategoryStats()

  return (
    <section
      className="bg-[#FAF7F2] py-10 sm:py-14 lg:py-16"
      aria-labelledby="category-collections-heading"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 sm:mb-8">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B87333]">
            Shop by Category
          </p>
          <h2
            id="category-collections-heading"
            className="text-xl font-bold text-stone-900 sm:text-2xl"
          >
            Collections from Kashmir
          </h2>
        </header>

        <div className="lg:hidden">
          <CategoryCarousel itemCount={CATEGORY_VISUALS.length}>
            {CATEGORY_VISUALS.map((category, index) => {
              const { count } = resolveCategoryStats(category.id, stats)
              return (
                <div key={category.id} className={CATEGORY_CAROUSEL_ITEM_CLASS}>
                  <CategoryCard
                    id={category.id}
                    name={category.name}
                    image={category.image}
                    imageAlt={category.imageAlt}
                    productCount={count}
                    priority={index === 0}
                  />
                </div>
              )
            })}
          </CategoryCarousel>
        </div>

        <ul className="hidden list-none gap-x-5 gap-y-8 lg:grid lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
          {CATEGORY_VISUALS.map((category, index) => {
            const { count } = resolveCategoryStats(category.id, stats)
            return (
              <li key={category.id} className="min-w-0">
                <CategoryCard
                  id={category.id}
                  name={category.name}
                  image={category.image}
                  imageAlt={category.imageAlt}
                  productCount={count}
                  priority={index < 4}
                />
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
