import coverImage from '../assets/brand/landing-cover.png'
import logoImage from '../assets/brand/blyver-logo.png'

function HomePage() {
  return (
    <main className="min-h-screen bg-blyver-ink text-blyver-ivory">
      <section className="relative isolate min-h-[320px] overflow-hidden bg-black sm:min-h-0 sm:aspect-[1942/809]">
        <div className="absolute inset-0 bg-black">
          <img
            src={coverImage}
            alt="Blyver watches and leather accessories"
            className="h-full w-full object-contain sm:object-cover"
          />
        </div>

        <header className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/65 to-transparent">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
            <a href="/" aria-label="Blyver home" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-blyver-ivory/95 p-1.5">
                <img src={logoImage} alt="" className="size-full object-contain" />
              </span>
              <span className="text-sm tracking-[0.32em] text-blyver-ivory">BLYVER</span>
            </a>

            <nav className="hidden items-center gap-8 text-xs tracking-[0.18em] text-blyver-ivory/85 md:flex">
              <a href="/collections" className="transition hover:text-blyver-champagne">COLLECTIONS</a>
              <a href="#story" className="transition hover:text-blyver-champagne">OUR STORY</a>
              <a href="#contact" className="transition hover:text-blyver-champagne">CONTACT</a>
            </nav>

            <button type="button" className="text-xs tracking-[0.18em] text-blyver-ivory md:hidden">
              MENU
            </button>
          </div>
        </header>
      </section>

      <div className="flex justify-center px-6 py-8 sm:py-10">
        <a href="/collections" className="text-xs tracking-[0.22em] text-blyver-champagne transition hover:text-blyver-ivory">
          EXPLORE COLLECTIONS
        </a>
      </div>
    </main>
  )
}

export default HomePage
