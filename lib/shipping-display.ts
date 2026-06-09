import { formatInrAmount, type ShippingSettings } from '@/lib/shipping'

export type { ShippingSettings }
export { formatInrAmount }

export type ShippingDisplay = {
  lineLabel: string
  summaryNote: string
  homepageHeadline: string
  homepageDescription: string
}

export function buildShippingDisplay(shipping: ShippingSettings): ShippingDisplay {
  const threshold = Math.max(0, shipping.freeShippingThreshold ?? 0)
  const rate = Math.max(0, shipping.defaultRate ?? 0)
  const thresholdLabel = formatInrAmount(threshold)
  const rateLabel = formatInrAmount(rate)

  if (threshold <= 0 && rate <= 0) {
    return {
      lineLabel: 'Free delivery',
      summaryNote: 'Standard delivery is included on all orders.',
      homepageHeadline: 'Free delivery on every order',
      homepageDescription:
        'Stock up on handcrafted treats, spices, and wellness staples — standard delivery is on us across India.',
    }
  }

  if (threshold > 0 && rate <= 0) {
    return {
      lineLabel: `Free above ${thresholdLabel}`,
      summaryNote: `Free delivery on orders above ${thresholdLabel}. Below that, delivery fees are confirmed at checkout.`,
      homepageHeadline: `Free shipping above ${thresholdLabel}`,
      homepageDescription: `Stock up on handcrafted treats, spices, and wellness staples — standard delivery is on us for prepaid orders above ${thresholdLabel} across India.`,
    }
  }

  if (threshold <= 0 && rate > 0) {
    return {
      lineLabel: rateLabel,
      summaryNote: `Standard delivery is ${rateLabel} per order.`,
      homepageHeadline: `Standard delivery ${rateLabel}`,
      homepageDescription: `Pan-India delivery on all orders. Standard shipping is ${rateLabel}.`,
    }
  }

  return {
    lineLabel: `${rateLabel} · free above ${thresholdLabel}`,
    summaryNote: `Delivery is ${rateLabel} on orders below ${thresholdLabel}, and free at or above ${thresholdLabel}.`,
    homepageHeadline: `Free shipping above ${thresholdLabel}`,
    homepageDescription: `Standard delivery is ${rateLabel} on smaller orders and free above ${thresholdLabel} across India.`,
  }
}
