import { PRODUCT_CATEGORIES } from '@/lib/constants'

/** 4:5 editorial crop — replace with brand-owned Cloudinary shoots when available */
function editorialPhoto(photoId: string, width = 1000) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&h=${Math.round(width * 1.25)}&q=85`
}

export type CategoryVisual = {
  id: string
  name: string
  image: string
  imageAlt: string
}

const CATEGORY_IMAGES: Record<
  string,
  Pick<CategoryVisual, 'image' | 'imageAlt'>
> = {
  'handmade-healthy-bites': {
    image: editorialPhoto('photo-1589308078051-8d76163d9218', 1200),
    imageAlt: 'Handmade laddus and panjeeri on a wooden tray in warm kitchen light',
  },
  'customised-handmade': {
    image: editorialPhoto('photo-1511381939411-a4406a47ebd9'),
    imageAlt: 'Luxury handmade chocolates in an open gift box',
  },
  'kashmir-delights': {
    image: editorialPhoto('photo-1596040033229-a9821ebd058d'),
    imageAlt: 'Traditional Kashmiri delights on a copper serving tray',
  },
  spices: {
    image: editorialPhoto('photo-1615485290382-44100d406ea8'),
    imageAlt: 'Premium Kashmiri saffron threads in macro photography',
  },
  kehwa: {
    image: editorialPhoto('photo-1576092762793-cc97164df69f'),
    imageAlt: 'Kashmiri kehwa being poured with steam rising',
  },
  'farm-fresh-dry-fruits-nuts': {
    image: editorialPhoto('photo-1599599810769-bcde055a64d2'),
    imageAlt: 'Premium walnuts, almonds and pistachios on rustic wood',
  },
  seeds: {
    image: editorialPhoto('photo-1513364770482-f97fafba4705'),
    imageAlt: 'Chia, flax and pumpkin seeds in ceramic bowls',
  },
  honey: {
    image: editorialPhoto('photo-1587049352846-4a222782752e'),
    imageAlt: 'Raw honey in a glass jar with wooden dipper',
  },
  shilajit: {
    image: editorialPhoto('photo-1608571423902-eed4a5ad8108'),
    imageAlt: 'Premium shilajit resin in amber glass on stone',
  },
}

export const CATEGORY_VISUALS: CategoryVisual[] = PRODUCT_CATEGORIES.map(
  (category) => {
    const visual = CATEGORY_IMAGES[category.id]
    return {
      id: category.id,
      name: category.name,
      image: visual?.image ?? editorialPhoto('photo-1589308078051-8d76163d9218'),
      imageAlt: visual?.imageAlt ?? `${category.name} collection from Zescoh`,
    }
  },
)
