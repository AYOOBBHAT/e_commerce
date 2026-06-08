/**
 * Seed MongoDB categories from legacy PRODUCT_CATEGORIES + CATEGORY_VISUALS.
 *
 * Usage: npm run seed:categories
 * Requires MONGODB_URI in .env or .env.local
 */
(function loadEnvFiles() {
  const fs = require('fs')
  const path = require('path')
  const root = process.cwd()
  const files = ['.env', '.env.local', '.env.development', '.env.development.local']

  for (const file of files) {
    const envPath = path.resolve(root, file)
    if (!fs.existsSync(envPath)) continue

    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
    for (const line of lines) {
      if (!line || line.startsWith('#')) continue
      const idx = line.indexOf('=')
      if (idx === -1) continue
      const key = line.slice(0, idx).trim()
      let val = line.slice(idx + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      process.env[key] = val
    }
  }
})()

function maskMongoUri(uri) {
  return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@')
}

function printMongoConnectionHelp(error) {
  const uri = process.env.MONGODB_URI || ''
  const hostMatch = uri.match(/@([^/?]+)/)
  const host = hostMatch ? hostMatch[1] : 'unknown'

  console.error('\nCould not connect to MongoDB.')
  console.error(`URI host: ${host}`)
  if (uri) console.error(`URI (masked): ${maskMongoUri(uri)}`)
  console.error(`Error: ${error.message}\n`)

  if (error.code === 'ENOTFOUND' || String(error.message).includes('querySrv')) {
    console.error('DNS could not resolve your Atlas cluster. Common fixes:')
    console.error('1. Open MongoDB Atlas → your cluster → Connect → Drivers')
    console.error('2. Copy a fresh connection string and update MONGODB_URI in .env.local')
    console.error('3. Confirm the cluster still exists (not deleted/paused)')
    console.error('4. If SRV DNS is blocked, use Atlas “Standard connection string” instead of mongodb+srv')
    console.error('5. Check internet/VPN/firewall, or try DNS 8.8.8.8')
  }

  console.error('\nThe seed script reads (in order, later overrides):')
  console.error('.env → .env.local → .env.development → .env.development.local')
}

function editorialPhoto(photoId, width = 1000) {
  const height = Math.round(width * 1.25)
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&h=${height}&q=85`
}

const PRODUCT_CATEGORIES = [
  { id: 'handmade-healthy-bites', name: 'Handmade Healthy Bites' },
  { id: 'customised-handmade', name: 'Custom Chocolates' },
  { id: 'kashmir-delights', name: 'Kashmiri Delights' },
  { id: 'spices', name: 'Kashmiri Saffron' },
  { id: 'kehwa', name: 'Kashmiri Kehwa' },
  { id: 'farm-fresh-dry-fruits-nuts', name: 'Dry Fruits & Nuts' },
  { id: 'seeds', name: 'Seeds & Superfoods' },
  { id: 'honey', name: 'Raw Honey' },
  { id: 'shilajit', name: 'Himalayan Shilajit' },
]

const CATEGORY_IMAGES = {
  'handmade-healthy-bites': {
    image: editorialPhoto('photo-1589308078051-8d76163d9218', 1200),
    imageAlt:
      'Handmade laddus and panjeeri on a wooden tray in warm kitchen light',
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

function getSeedDocuments() {
  return PRODUCT_CATEGORIES.map((category, index) => {
    const visual = CATEGORY_IMAGES[category.id]
    return {
      slug: category.id,
      name: category.name,
      image:
        visual?.image ??
        editorialPhoto('photo-1589308078051-8d76163d9218', 1200),
      imageAlt:
        visual?.imageAlt ?? `${category.name} collection from Zescoh`,
      sortOrder: index,
      isActive: true,
      hideWhenEmpty: true,
    }
  })
}

const categorySchema = new (require('mongoose').Schema)(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    imageAlt: { type: String, required: true },
    sortOrder: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
    hideWhenEmpty: { type: Boolean, default: true },
  },
  { timestamps: true },
)

;(async () => {
  const mongoose = require('mongoose')
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Add it to .env or .env.local in the project root.',
    )
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  } catch (error) {
    printMongoConnectionHelp(error)
    process.exit(1)
  }
  const Category =
    mongoose.models.Category || mongoose.model('Category', categorySchema)

  const documents = getSeedDocuments()
  let created = 0
  let updated = 0

  for (const doc of documents) {
    const result = await Category.updateOne(
      { slug: doc.slug },
      { $set: doc },
      { upsert: true },
    )
    if (result.upsertedCount > 0) created += 1
    else if (result.modifiedCount > 0) updated += 1
  }

  console.log(
    `Category seed complete: ${documents.length} processed (${created} created, ${updated} updated).`,
  )
  console.log('Set USE_DB_CATEGORIES=true in .env to serve categories from MongoDB.')

  await mongoose.disconnect()
})().catch((error) => {
  if (!String(error.message).includes('MONGODB_URI is not set')) {
    printMongoConnectionHelp(error)
  } else {
    console.error(error.message)
  }
  process.exit(1)
})
