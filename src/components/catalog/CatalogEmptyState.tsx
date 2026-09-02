type CatalogEmptyStateProps = {
  title: string
  description: string
}

function CatalogEmptyState({ title, description }: CatalogEmptyStateProps) {
  return (
    <div className="border border-blyver-ink/10 bg-blyver-ivory px-6 py-16 text-center sm:px-10 sm:py-24">
      <p className="text-[11px] tracking-[0.2em] text-blyver-champagne">BLYVER CATALOGUE</p>
      <h2 className="mt-4 font-serif text-3xl sm:text-4xl">{title}</h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-blyver-charcoal/65">{description}</p>
    </div>
  )
}

export default CatalogEmptyState
