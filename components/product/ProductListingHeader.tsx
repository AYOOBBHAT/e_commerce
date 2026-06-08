type ProductListingHeaderProps = {
  title: string
  eyebrow?: string
  description?: string
}

export default function ProductListingHeader({
  title,
  eyebrow,
  description,
}: ProductListingHeaderProps) {
  return (
    <header className="mb-6 sm:mb-8">
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B87333]">
          {eyebrow}
        </p>
      )}
      <h1
        className={`text-2xl font-bold capitalize text-stone-900 sm:text-3xl ${
          eyebrow ? 'mt-1.5' : ''
        }`}
      >
        {title}
      </h1>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
          {description}
        </p>
      )}
    </header>
  )
}
