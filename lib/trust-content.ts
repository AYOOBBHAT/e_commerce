import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  HandHeart,
  Layers,
  MapPin,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react'

export type TrustPillar = {
  id: string
  title: string
  description: string
  icon: LucideIcon
}

/** Factual proof only — no ratings or order counts unless wired to real data later */
export const TRUST_PROOF_SIGNALS = [
  'Handmade in Kashmir',
  'FSSAI Licensed',
  'Valley Sourced',
  'Freshly Packed',
  'Pan-India Delivery',
] as const

/** Compact trust strip shown below PDP CTAs */
export const PDP_TRUST_STRIP = [
  'Handmade in Kashmir',
  'Small Batch Crafted',
  'FSSAI Licensed',
  'Freshly Packed',
  'Pan-India Delivery',
] as const

export const TRUST_PILLARS: TrustPillar[] = [
  {
    id: 'handmade',
    title: 'Handmade in Kashmir',
    description:
      'Crafted in small batches in our Srinagar kitchen using traditional valley recipes — not factory-produced imitations.',
    icon: HandHeart,
  },
  {
    id: 'no-sugar',
    title: 'No Added Sugar · No Preservatives',
    description:
      'Our handmade luddus, panjeeri, and chocolates use pure desi ghee and natural ingredients — without added sugar or chemical preservatives.',
    icon: ShieldCheck,
  },
  {
    id: 'small-batch',
    title: 'Small Batch Crafted',
    description:
      'We produce in limited runs and pack fresh, so what reaches you reflects the care of a recent batch — not long-stored catalog stock.',
    icon: Layers,
  },
  {
    id: 'fssai',
    title: 'FSSAI Licensed · Quality Standards',
    description:
      'Zescoh operates under FSSAI licensing with hygienic, modern packaging — and lab testing on select wellness products such as shilajit and saffron.',
    icon: BadgeCheck,
  },
  {
    id: 'valley-sourced',
    title: 'Valley-Sourced Ingredients',
    description:
      'Saffron from Pampore, walnuts from Kashmir orchards, and spices chosen at source — traced to the valley, not anonymously blended in bulk.',
    icon: MapPin,
  },
  {
    id: 'delivery',
    title: 'Pan-India Delivery · Freshly Packed',
    description:
      'Orders are packed with care in Kashmir and shipped across India — so distance does not compromise what arrives at your door.',
    icon: PackageCheck,
  },
]

export const TRUST_SECTION_COPY = {
  eyebrow: 'Our Commitment · ZeeShaEla & Co., Kashmir',
  title: 'The Zescoh Promise',
  subcopy:
    'Every product passes through our Srinagar kitchen or partner farms before it reaches your door — handmade where it matters, tested where it must be.',
  quote:
    'We do not sell catalog food. We pack what we would serve our own family.',
  quoteAttribution: 'ZeeShaEla & Co., Kashmir',
  standardsLine:
    'Pampore saffron · Lab-tested shilajit · Hygienic packaging · No hidden ingredients',
  storyLink: {
    href: '/quick-links/about-us',
    label: 'Read our story',
  },
} as const

/** Editorial image — replace with brand-owned Cloudinary asset when available */
export const TRUST_EDITORIAL_IMAGE = {
  src: 'https://images.unsplash.com/photo-1589308078051-8d76163d9218?auto=format&fit=crop&w=800&h=1000&q=85',
  alt: 'Handmade laddus and panjeeri prepared in a warm Kashmiri kitchen setting',
} as const
