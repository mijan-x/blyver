import { Link } from 'react-router-dom'

type PagePlaceholderProps = {
  eyebrow: string
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}

function PagePlaceholder({ eyebrow, title, description, actionLabel = 'EXPLORE COLLECTIONS', actionTo = '/collections' }: PagePlaceholderProps) {
  return (
    <main className="flex min-h-[58vh] items-center bg-blyver-ivory px-6 py-18 text-blyver-ink sm:px-10">
      <section className="mx-auto w-full max-w-7xl border-l border-blyver-champagne pl-6 sm:pl-10">
        <p className="text-[11px] tracking-[0.24em] text-blyver-champagne">{eyebrow}</p>
        <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight sm:text-6xl">{title}</h1>
        <p className="mt-6 max-w-xl text-sm leading-7 text-blyver-charcoal/75">{description}</p>
        <Link to={actionTo} className="mt-9 inline-block border-b border-blyver-ink pb-2 text-[11px] tracking-[0.18em] transition-colors hover:border-blyver-champagne hover:text-blyver-champagne">
          {actionLabel}
        </Link>
      </section>
    </main>
  )
}

export default PagePlaceholder
