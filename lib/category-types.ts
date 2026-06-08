export type CategoryRecord = {
  slug: string
  name: string
  image: string
  imagePublicId?: string
  imageAlt: string
  sortOrder: number
  isActive: boolean
  hideWhenEmpty: boolean
}

export type NavCategory = Pick<CategoryRecord, 'slug' | 'name'>

export type CategoryImageFields = {
  image: string
  imagePublicId?: string
}
