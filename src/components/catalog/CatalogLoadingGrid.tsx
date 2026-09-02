function CatalogLoadingGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading catalogue">
      {Array.from({ length: 4 }, (_, index) => <div key={index} className="animate-pulse"><div className="aspect-square bg-blyver-charcoal/10" /><div className="mt-5 h-5 w-3/4 bg-blyver-charcoal/10" /><div className="mt-3 h-4 w-full bg-blyver-charcoal/10" /><div className="mt-2 h-4 w-1/2 bg-blyver-charcoal/10" /></div>)}
    </div>
  )
}

export default CatalogLoadingGrid
