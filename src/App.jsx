import { useState } from 'react'
import CallToAction from './components/CallToAction.jsx'
import ContactForm from './components/ContactForm.jsx'
import Footer from './components/Footer.jsx'
import HeroSection from './components/HeroSection.jsx'
import Navbar from './components/Navbar.jsx'
import PackageCard from './components/PackageCard.jsx'
import ProcessStep from './components/ProcessStep.jsx'
import Reveal from './components/Reveal.jsx'
import ServiceCard from './components/ServiceCard.jsx'
import SectionHeading from './components/SectionHeading.jsx'
import { comparisonRows, packageFilters, packages } from './data/packages.js'
import './App.css'

const services = [
  ['01', 'Producción audiovisual', 'Ordenamos ideas, mensajes y dirección visual para que cada pieza tenga intención.'],
  ['02', 'Grabación', 'Videos verticales, tomas de producto, testimonios y escenas de marca para redes.'],
  ['03', 'Fotografía', 'Fotos de producto, detalles, retratos y material visual para publicaciones o catálogos.'],
  ['04', 'Edición para redes', 'Cortes dinámicos, subtítulos, color, música y adaptaciones listas para publicar.'],
]

const processSteps = [
  ['01', 'Descubrimos', 'Entendemos qué necesita tu marca y qué quieres comunicar.'],
  ['02', 'Conceptualizamos', 'Convertimos la idea en una dirección visual concreta.'],
  ['03', 'Producimos', 'Grabamos, fotografiamos y dirigimos cada toma.'],
  ['04', 'Entregamos', 'Recibes piezas listas para comunicar y publicar.'],
]

const trustPoints = [
  ['Paquetes claros', 'Sabes el precio, los entregables y el alcance antes de comenzar.'],
  ['Criterio creativo', 'No compras solo horas de cámara: compras dirección para comunicar mejor.'],
  ['Proceso claro', 'El cliente sabe qué recibe, cuándo y cómo se revisa.'],
]

export default function App() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedPackage, setSelectedPackage] = useState('')

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />

        <section className="section-band compact showreel-section" id="showreel">
          <div className="container">
            <SectionHeading eyebrow="Así se ve BRUMA" title="Un espacio listo para mostrar el resultado.">
              Un bloque visual para presentar el video principal de la agencia, con ritmo, estilo y ejemplos reales cuando el material esté listo.
            </SectionHeading>
            <Reveal className="showreel-frame" aria-label="Contenedor preparado para video showreel">
              <video className="showreel-video" autoPlay muted loop playsInline preload="metadata" poster={`${import.meta.env.BASE_URL}bruma-studio.svg`}>
                <source src="https://videos.pexels.com/video-files/34149137/14478811_1080_1920_30fps.mp4" type="video/mp4" />
                Tu navegador no soporta video HTML5.
              </video>
              <div className="showreel-overlay" aria-hidden="true" />
              <div className="showreel-meta">
                <span>Formato recomendado: 16:9</span>
                <span>Video de marca, reels, fotografía y producción</span>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section-band compact" id="servicios">
          <div className="container">
            <SectionHeading eyebrow="Qué hacemos" title="Contenido dirigido, producido y editado con criterio.">
              No solo ejecutamos una lista de tomas. Pensamos qué necesita comunicar tu marca y convertimos esa idea en piezas útiles para redes.
            </SectionHeading>
            <div className="row g-4">
              {services.map(([number, title, description]) => (
                <div className="col-md-6 col-xl-3" key={number}>
                  <ServiceCard number={number} title={title} description={description} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-band compact why-section" id="bruma">
          <div className="container">
            <Reveal className="why-panel">
              <p className="eyebrow">Por qué BRUMA</p>
              <h2>No solo grabamos contenido. Diseñamos cómo tu marca debe verse.</h2>
              <p>El valor está en el criterio: entender qué quieres comunicar, dirigir la producción y entregar piezas audiovisuales que ayuden a tu marca a verse clara, actual y confiable.</p>
              <div className="why-points" aria-label="Diferenciales de BRUMA">
                <span>Dirección visual</span>
                <span>Producción eficiente</span>
                <span>Entrega lista para redes</span>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section-band packages-section" id="paquetes">
          <div className="container">
            <SectionHeading eyebrow="Paquetes BRUMA" title="Elige según tu etapa, presupuesto y ritmo de publicación.">
              Todos los planes incluyen una reunión breve, dirección durante la producción y entrega organizada para que sepas exactamente qué recibes.
            </SectionHeading>
            <div className="package-filter" role="group" aria-label="Filtrar paquetes">
              {packageFilters.map(({ id, label }) => (
                <button
                  className={`filter-btn${activeFilter === id ? ' active' : ''}`}
                  type="button"
                  key={id}
                  aria-pressed={activeFilter === id}
                  onClick={() => setActiveFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="row g-4 align-items-stretch">
              {packages.map((packageInfo) => (
                  <div className={`package-item col-lg-4${activeFilter !== 'all' && activeFilter !== packageInfo.category ? ' is-hidden' : ''}`} data-category={packageInfo.category} key={packageInfo.id}>
                  <PackageCard packageInfo={packageInfo} onSelect={setSelectedPackage} />
                </div>
              ))}
            </div>
            <p className="delivery-note">Primer corte en 48h para revisar dirección y ritmo. La entrega final depende del paquete elegido y de las rondas de ajustes.</p>
          </div>
        </section>

        <section className="section-band compact" id="comparar">
          <div className="container">
            <SectionHeading eyebrow="Comparación rápida" title="Todo claro antes de escribirnos.">
              Compara entregables, tiempos y nivel de acompañamiento para decidir sin vueltas.
            </SectionHeading>
            <Reveal className="comparison-table-wrap">
              <table className="comparison-table">
                <thead><tr><th scope="col">Incluye</th><th scope="col">Base</th><th scope="col">Impulso</th><th scope="col">Pro</th></tr></thead>
                <tbody>
                  {comparisonRows.map(([label, ...values]) => (
                    <tr key={label}><th scope="row">{label}</th>{values.map((value, index) => <td key={`${label}-${index}`}>{value}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          </div>
        </section>

        <section className="section-band" id="proceso">
          <div className="container">
            <div className="row g-5 align-items-center">
              <div className="col-lg-5">
                <SectionHeading eyebrow="Cómo trabajamos" title="Una experiencia simple para gente ocupada." align="start">
                  Te ayudamos a decidir qué grabar, qué mostrar y cómo convertirlo en publicaciones útiles para tu negocio.
                </SectionHeading>
              </div>
              <div className="col-lg-7">
                <div className="process-grid">
                  {processSteps.map(([number, title, description]) => (
                    <ProcessStep number={number} title={title} description={description} key={number} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-band compact trust-section" id="confianza">
          <div className="container">
            <Reveal className="trust-panel">
              <div><p className="eyebrow">Confianza</p><h2>Claridad antes, durante y después de producir.</h2></div>
              <div className="trust-grid">
                {trustPoints.map(([title, description]) => (
                  <article key={title}><strong>{title}</strong><span>{description}</span></article>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section-band contact-section" id="contacto">
          <div className="container">
            <Reveal className="contact-panel">
              <div>
                <p className="eyebrow">Hablemos</p>
                <h2>Solicita tu paquete audiovisual con BRUMA.</h2>
                <p>Cuéntanos qué vendes, qué redes usas y qué servicio necesitas. Te responderemos con disponibilidad, paquete sugerido y siguientes pasos.</p>
                <div className="contact-info"><span>Email: reemplazar por correo real</span><span>WhatsApp: reemplazar por número real</span></div>
              </div>
              <ContactForm selectedPackage={selectedPackage} onPackageChange={setSelectedPackage} />
            </Reveal>
          </div>
        </section>

        <section className="section-band compact final-cta-section">
          <div className="container">
            <CallToAction
              className="final-cta"
              eyebrow="¿Tienes una idea?"
              title="Convirtámosla en contenido."
              actions={[{ label: 'Trabajemos juntos', href: '#contacto' }]}
            />
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
