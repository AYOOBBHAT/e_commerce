import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import { getCategoryStats, type CategoryStatsMap } from '@/lib/actions/products'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import CategoryCarousel from '@/components/home/CategoryCarousel'

/** 4:5 editorial crop — replace with brand-owned Cloudinary shoots when available */
function editorialPhoto(photoId: string, width = 1000) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&h=${Math.round(width * 1.25)}&q=85`
}

export type SocialProofLabel =
  | 'Best Seller'
  | 'Most Loved'
  | 'Customer Favorite'
  | '500+ Orders'
  | 'Top Rated'

export type PremiumAccent = 'copper' | 'saffron'

export interface CategoryCollectionMeta {
  id: string
  name: string
  featured: boolean
  trustBadges: readonly [string, string]
  brandStory: string
  /** Extended copy shown only on the featured hero card */
  featuredStory?: string
  image: string
  imageAlt: string
  socialProof?: SocialProofLabel
  premiumAccent?: PremiumAccent
  showKashmirOrigin?: boolean
}

export interface CategoryCardData extends CategoryCollectionMeta {
  productCount: number
  fromPrice: number | null
}

const categoryData: CategoryCollectionMeta[] = [
  {
    ...PRODUCT_CATEGORIES[0],
    featured: true,
    trustBadges: ['No Added Sugar', 'Made Fresh Weekly'],
    brandStory:
      'Power-packed luddus and nourishing panjeeri — rolled by hand every week in our Srinagar kitchen.',
    featuredStory:
      'The heart of Zescoh — luddus and panjeeri rolled fresh every week in Srinagar with pure desi ghee, no added sugar, and no preservatives. This is what we are known for.',
    socialProof: 'Best Seller',
    premiumAccent: 'copper',
    showKashmirOrigin: true,
    image: editorialPhoto('photo-1589308078051-8d76163d9218', 1400),
    imageAlt: 'Handmade laddus and panjeeri arranged on a wooden tray in a warm kitchen',
  },
  {
    ...PRODUCT_CATEGORIES[1],
    featured: false,
    trustBadges: ['Made to Order', 'Premium Gifting'],
    brandStory:
      'Indulgent couverture chocolates, hand-poured and personalised for the gifts people remember.',
    socialProof: 'Customer Favorite',
    premiumAccent: 'copper',
    image: editorialPhoto('photo-1511381939411-a4406a47ebd9'),
    imageAlt: 'Luxury handmade chocolates in an open gift box with festive presentation',
  },
  {
    ...PRODUCT_CATEGORIES[2],
    featured: false,
    trustBadges: ['Valley Heritage', 'Traditional Recipes'],
    brandStory:
      'Generations-old valley recipes — the flavours Kashmir serves to honoured guests.',
    socialProof: 'Most Loved',
    premiumAccent: 'copper',
    showKashmirOrigin: true,
    image: editorialPhoto('photo-1596040033229-a9821ebd058d'),
    imageAlt: 'Traditional Kashmiri delights served on a copper tray',
  },
  {
    ...PRODUCT_CATEGORIES[3],
    featured: false,
    trustBadges: ['Pampore Origin', 'Lab Tested'],
    brandStory:
      'Deep crimson saffron harvested from the renowned Pampore fields of Kashmir.',
    socialProof: 'Top Rated',
    premiumAccent: 'saffron',
    showKashmirOrigin: true,
    image: editorialPhoto('photo-1615485290382-44100d406ea8'),
    imageAlt: 'Premium Kashmiri saffron threads in macro photography',
  },
  {
    ...PRODUCT_CATEGORIES[4],
    featured: false,
    trustBadges: ['Traditional Blend', 'Valley Inspired'],
    brandStory:
      'Saffron-kissed kehwa steeped the way Kashmir welcomes you — warm, aromatic, unforgettable.',
    premiumAccent: 'copper',
    showKashmirOrigin: true,
    image: editorialPhoto('photo-1576092762793-cc97164df69f'),
    imageAlt: 'Kashmiri kehwa tea being poured with steam rising from a samovar',
  },
  {
    ...PRODUCT_CATEGORIES[5],
    featured: false,
    trustBadges: ['Farm Direct', 'Premium Grade'],
    brandStory:
      'Buttery walnuts and crisp almonds — hand-graded from orchards across the Kashmir valley.',
    socialProof: '500+ Orders',
    premiumAccent: 'copper',
    image: editorialPhoto('photo-1599599810769-bcde055a64d2'),
    imageAlt: 'Premium walnuts, almonds and pistachios on a rustic wooden surface',
  },
  {
    ...PRODUCT_CATEGORIES[6],
    featured: false,
    trustBadges: ['Clean Label', 'Daily Wellness'],
    brandStory:
      'Clean, raw superfoods chosen for the daily rituals of a healthier table.',
    premiumAccent: 'copper',
    image: editorialPhoto('photo-1513364770482-f97fafba4705'),
    imageAlt: 'Chia, flax and pumpkin seeds in ceramic bowls for everyday wellness',
  },
  {
    ...PRODUCT_CATEGORIES[7],
    featured: false,
    trustBadges: ['Single Origin', 'Unprocessed'],
    brandStory:
      'Golden, unheated honey — a single-origin pour that tastes of mountain wildflowers.',
    premiumAccent: 'copper',
    image: editorialPhoto('photo-1587049352846-4a222782752e'),
    imageAlt: 'Raw honey in a glass jar with a wooden dipper in natural sunlight',
  },
  {
    ...PRODUCT_CATEGORIES[8],
    featured: false,
    trustBadges: ['Third-Party Tested', 'Premium Resin'],
    brandStory:
      'Rare Himalayan resin, purified by tradition and verified for purity you can trust.',
    premiumAccent: 'copper',
    image: editorialPhoto('photo-1608571423902-eed4a5ad8108'),
    imageAlt: 'Premium shilajit resin in amber glass on dark Himalayan stone',
  },
]

const SECTION_TRUST_SIGNALS = [
  'Handmade in Kashmir',
  'FSSAI Licensed',
  'Pan-India Delivery',
  'Customer Loved',
] as const

function resolveCategoryStats(categoryId: string, stats: CategoryStatsMap) {
  return stats[categoryId] ?? { count: 0, fromPrice: null }
}

function buildCommerceMeta(productCount: number, fromPrice: number | null) {
  const countLabel = `${productCount} Product${productCount === 1 ? '' : 's'}`
  if (fromPrice == null) return countLabel
  return `${countLabel} • From ₹${fromPrice.toLocaleString('en-IN')}`
}

function buildAriaLabel(
  category: CategoryCollectionMeta,
  productCount: number,
  fromPrice: number | null,
) {
  const countPart = `${productCount} product${productCount === 1 ? '' : 's'}`
  const pricePart =
    fromPrice != null
      ? ` starting from ₹${fromPrice.toLocaleString('en-IN')}`
      : ''
  const proofPart = category.socialProof ? `, ${category.socialProof}` : ''
  return `Browse ${category.name} collection, ${countPart}${pricePart}${proofPart}`
}

type CategoryCardProps = {
  category: CategoryCollectionMeta
  productCount: number
  fromPrice: number | null
  className?: string
}

export function CategoryCard({
  category,
  productCount,
  fromPrice,
  className,
}: CategoryCardProps) {
  const isHero = category.featured
  const commerceMeta = buildCommerceMeta(productCount, fromPrice)
  const accentColor =
    category.premiumAccent === 'saffron' ? 'bg-[#C4A035]' : 'bg-[#B87333]'
  const storyText =
    isHero && category.featuredStory ? category.featuredStory : category.brandStory

  return (
    <Link
      href={`/category/${category.id}`}
      aria-label={buildAriaLabel(category, productCount, fromPrice)}
      className={cn(
        'group relative block overflow-hidden rounded-2xl bg-stone-900 shadow-sm shadow-stone-900/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2]',
        'transition-shadow duration-300 hover:shadow-xl hover:shadow-stone-900/25',
        className,
      )}
    >
      <div
        className={cn(
          'relative w-full',
          isHero
            ? 'aspect-[4/5] min-h-[420px] sm:min-h-0 sm:aspect-[2/1] lg:aspect-[5/2]'
            : 'aspect-[4/5]',
        )}
      >
        <Image
          src={category.image}
          alt={category.imageAlt}
          fill
          priority={isHero}
          quality={isHero ? 90 : 85}
          className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04]"
          sizes={
            isHero
              ? '(max-width: 1023px) 100vw, 66vw'
              : '(max-width: 1023px) 82vw, (max-width: 1280px) 33vw, 25vw'
          }
        />

        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/50 to-stone-950/10 transition-colors duration-300 motion-safe:group-hover:from-stone-950/98"
        />

        {isHero && (
          <>
            <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-[#B87333]" />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-px bg-[#B87333]/40"
            />
          </>
        )}

        {/* Proof-driven trust badges — top-left */}
        <div
          className={cn(
            'absolute top-2.5 left-2.5 z-10 flex max-w-[58%] flex-col gap-1 sm:top-3 sm:left-3 sm:max-w-[70%] sm:flex-row sm:flex-wrap sm:gap-1.5',
            isHero && 'sm:top-4 sm:left-4',
          )}
          aria-hidden
        >
          {category.trustBadges.map((badge) => (
            <span
              key={badge}
              className={cn(
                'rounded-full border border-white/25 bg-stone-950/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-md',
                'transition-colors duration-300 motion-safe:group-hover:border-white/45 motion-safe:group-hover:bg-stone-950/80',
                'sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-wider',
                isHero && 'sm:text-[11px]',
              )}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Social proof — top-right */}
        {category.socialProof && (
          <span
            className={cn(
              'absolute top-2.5 right-2.5 z-10 rounded-full bg-amber-400/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-stone-900 backdrop-blur-sm',
              'transition-colors duration-300 motion-safe:group-hover:bg-amber-300',
              'sm:top-3 sm:right-3 sm:px-2.5 sm:py-1 sm:text-[10px]',
              isHero && 'sm:top-4 sm:right-4 sm:px-3 sm:py-1.5 sm:text-[11px]',
            )}
          >
            {category.socialProof}
          </span>
        )}

        {/* Text overlay */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 z-10 p-3.5 sm:p-4',
            isHero && 'sm:p-6 lg:p-8',
          )}
        >
          <div
            aria-hidden
            className={cn(
              'absolute bottom-3 left-0 top-2 w-0.5 rounded-full opacity-80',
              accentColor,
              isHero && 'w-1',
              'motion-safe:transition-opacity motion-safe:group-hover:opacity-100',
            )}
          />

          <div className={cn('pl-2.5 sm:pl-3', isHero && 'sm:pl-4')}>
            {category.showKashmirOrigin && (
              <span
                className={cn(
                  'mb-1 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-300/95 sm:text-[10px]',
                  isHero && 'sm:mb-1.5 sm:text-xs',
                )}
              >
                <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden />
                Kashmir Origin
              </span>
            )}

            {isHero && (
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/90 sm:text-xs">
                The Zescoh Signature
              </p>
            )}

            <h3
              className={cn(
                'font-semibold leading-snug text-white',
                isHero
                  ? 'text-xl sm:text-3xl lg:text-4xl'
                  : 'text-sm sm:text-base',
              )}
            >
              {category.name}
            </h3>

            <p
              className={cn(
                'mt-1 font-medium text-white',
                isHero ? 'text-sm sm:text-base' : 'text-xs sm:text-sm',
              )}
            >
              <span>{`${productCount} Product${productCount === 1 ? '' : 's'}`}</span>
              {fromPrice != null && (
                <>
                  <span className="mx-1.5 text-white/50" aria-hidden>
                    •
                  </span>
                  <span
                    className={cn(
                      'font-semibold',
                      category.premiumAccent === 'saffron'
                        ? 'text-[#E8C547]'
                        : 'text-amber-300',
                    )}
                  >
                    {`From ₹${fromPrice.toLocaleString('en-IN')}`}
                  </span>
                </>
              )}
            </p>

            <p className="sr-only">{commerceMeta}</p>

            <p
              className={cn(
                'mt-1.5 line-clamp-2 leading-relaxed text-white/85',
                isHero
                  ? 'line-clamp-3 text-xs sm:text-sm sm:leading-relaxed'
                  : 'text-[11px] sm:text-xs',
              )}
            >
              {storyText}
            </p>

            <p
              className={cn(
                'mt-2 font-semibold text-amber-300',
                isHero ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs',
                'opacity-100 lg:opacity-0 lg:transition-opacity lg:duration-300',
                'motion-safe:lg:group-hover:opacity-100 group-focus-visible:opacity-100',
              )}
            >
              Explore Collection →
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default async function CategoryGrid() {
  const stats = await getCategoryStats()
  const hero = categoryData.find((category) => category.featured)!
  const rest = categoryData.filter((category) => !category.featured)

  const heroStats = resolveCategoryStats(hero.id, stats)

  return (
    <section
      className="bg-[#FAF7F2] py-12 sm:py-16"
      aria-labelledby="category-collections-heading"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-10">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-600">
            From the Valley · Handcrafted by Zescoh
          </p>
          <h2
            id="category-collections-heading"
            className="text-2xl font-bold leading-tight text-stone-900 sm:text-3xl lg:text-4xl"
          >
            Collections from Kashmir
          </h2>

          <p
            className="mx-auto mt-3 max-w-3xl text-[11px] font-medium text-stone-600 sm:text-xs"
            aria-label="Brand trust signals"
          >
            {SECTION_TRUST_SIGNALS.join(' • ')}
          </p>

          <p className="mx-auto mt-3 max-w-2xl text-sm text-stone-600 sm:text-base">
            Editorial collections of handmade treats, valley saffron, kehwa, and
            pantry staples — photographed and packed with care in Kashmir.
          </p>
        </div>

        {/* Mobile: hero + snap carousel */}
        <div className="space-y-4 lg:hidden">
          <CategoryCard
            category={hero}
            productCount={heroStats.count}
            fromPrice={heroStats.fromPrice}
          />

          <CategoryCarousel itemCount={rest.length}>
            {rest.map((category) => {
              const { count, fromPrice } = resolveCategoryStats(category.id, stats)
              return (
                <div
                  key={category.id}
                  className="w-[82vw] max-w-sm shrink-0 snap-start snap-always"
                >
                  <CategoryCard
                    category={category}
                    productCount={count}
                    fromPrice={fromPrice}
                  />
                </div>
              )
            })}
          </CategoryCarousel>
        </div>

        {/* Desktop: hero spans 2 cols in 3-col grid */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-5">
          <CategoryCard
            category={hero}
            productCount={heroStats.count}
            fromPrice={heroStats.fromPrice}
            className="col-span-2"
          />
          {rest.map((category) => {
            const { count, fromPrice } = resolveCategoryStats(category.id, stats)
            return (
              <CategoryCard
                key={category.id}
                category={category}
                productCount={count}
                fromPrice={fromPrice}
              />
            )
          })}
        </div>

        <p className="mt-6 text-center text-xs text-stone-500">
          Packed with care at ZeeShaEla &amp; Co., Kashmir
        </p>
      </div>
    </section>
  )
}
