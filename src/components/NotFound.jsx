import AppLink from './AppLink.jsx'
import Footer from './Footer.jsx'
import Navbar from './Navbar.jsx'
import SectionHeading from './SectionHeading.jsx'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main>
        <section className="section-band">
          <div className="container">
            <SectionHeading
              eyebrow="Error 404"
              title="No encontramos esta página."
            >
              La dirección puede haber cambiado o no existir. Vuelve al inicio para seguir explorando BRUMA.
            </SectionHeading>
            <div className="not-found-action">
              <AppLink className="btn btn-accent btn-lg" href="/">
                Volver al inicio
              </AppLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
