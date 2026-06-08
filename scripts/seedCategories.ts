/**
 * Seed MongoDB categories from PRODUCT_CATEGORIES + CATEGORY_VISUALS.
 *
 * Usage:
 *   npm run seed:categories
 *
 * Requires MONGODB_URI in .env
 */
import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import { getSeedCategoryDocuments } from '../lib/seed-categories-data'

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return

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
    process.env[key] = process.env[key] || val
  }
}

const categorySchema = new mongoose.Schema(
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

async function main() {
  loadEnvFile()

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }

  await mongoose.connect(uri)
  const Category =
    mongoose.models.Category || mongoose.model('Category', categorySchema)

  const documents = getSeedCategoryDocuments()
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
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
