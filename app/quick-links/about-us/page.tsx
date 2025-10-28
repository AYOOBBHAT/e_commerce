export default function AboutUsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-10 text-center bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
          About Us
        </h1>

        <div className="space-y-8">
          <section className="bg-card border rounded-lg p-6 md:p-8 shadow-sm">
            <p className="text-foreground leading-relaxed text-lg md:text-xl font-medium">
              Welcome to <span className="text-primary font-bold text-xl">ZeeShaEla & Co</span>, the home of our proudly crafted brand{' '}
              <span className="text-orange-600 font-bold text-xl">Zescoh</span>.
              At Zescoh, we bring together tradition, purity, and innovation to create products that
              celebrate the true essence of nature.
            </p>
            <p className="text-foreground leading-relaxed mt-4 text-base md:text-lg">
              We specialize in premium dry fruits, spices, shilajit, saffron, tea, and pulses, carefully
              sourced and packed with the highest standards of quality. Our mission is simple yet profound:
              to pack the delight of nature's finest gifts and make them accessible and affordable for all.
            </p>
          </section>

          <section className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 md:p-8 shadow-sm">
            <h2 className="text-3xl font-bold mb-5 text-orange-700 dark:text-orange-400">
              Zescoh Handmade
            </h2>
            <p className="text-foreground leading-relaxed text-base md:text-lg">
              Under our Handmade Section, we craft wholesome treats using only the best quality dry fruits,
              pure desi ghee, and absolutely{' '}
              <span className="font-bold text-green-600 dark:text-green-400">no sugar, no preservatives, and no chemicals</span>.
              This makes our products a healthy and affordable alternative to market sweets and chocolates.
            </p>
            <p className="text-foreground leading-relaxed mt-5 font-semibold text-lg">
              Our handmade range includes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border-2 border-orange-300 dark:border-orange-700 shadow-sm">
                <h3 className="font-bold text-lg text-orange-600 dark:text-orange-400 mb-2">Luddus</h3>
                <p className="text-sm text-foreground">Power-packed with nutrition and taste</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border-2 border-orange-300 dark:border-orange-700 shadow-sm">
                <h3 className="font-bold text-lg text-orange-600 dark:text-orange-400 mb-2">Chocolates</h3>
                <p className="text-sm text-foreground">Indulgent yet guilt-free</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border-2 border-orange-300 dark:border-orange-700 shadow-sm">
                <h3 className="font-bold text-lg text-orange-600 dark:text-orange-400 mb-2">Panjeeri</h3>
                <p className="text-sm text-foreground">A traditional wellness delight</p>
              </div>
            </div>
          </section>

          <section className="bg-card border rounded-lg p-6 md:p-8 shadow-sm">
            <h2 className="text-3xl font-bold mb-6 text-primary">Why Choose Us</h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 font-bold text-xl">✓</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1">Purity & Quality</h3>
                  <p className="text-foreground/80">Every product is made with uncompromising quality standards.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">✓</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1">State-of-the-Art Packaging</h3>
                  <p className="text-foreground/80">We use modern, hygienic, and innovative packaging to preserve freshness.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-xl">✓</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1">Specialties</h3>
                  <p className="text-foreground/80">From our Shilajit to handmade luddus and chocolates, we offer products that are rooted in tradition yet crafted for modern lifestyles.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-r from-primary/10 to-orange-600/10 border-l-4 border-primary rounded-lg p-6 md:p-8 shadow-sm">
            <p className="text-foreground leading-relaxed text-lg md:text-xl font-medium italic">
              At Zescoh, we believe food is more than just consumption—it's health, culture, and joy shared
              with loved ones. We are committed to delivering not just products, but experiences filled with
              authenticity and trust.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
