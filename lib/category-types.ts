export type CategoryRecord = {
  slug: string
  name: string
  image: string
  imageAlt: string
  sortOrder: number
  isActive: boolean
  hideWhenEmpty: boolean
}

export type NavCategory = Pick<CategoryRecord, 'slug' | 'name'>
