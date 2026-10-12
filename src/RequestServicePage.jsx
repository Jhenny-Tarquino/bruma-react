import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import ContactForm from './components/ContactForm.jsx'
import Footer from './components/Footer.jsx'
import Navbar from './components/Navbar.jsx'
import AppLink from './components/AppLink.jsx'
import './App.css'

export default function RequestServicePage() {
  const { search } = useLocation()
  const [selectedPackage, setSelectedPackage] = useState(
    () => new URLSearchParams(search).get('package') ?? '',
  )

  return (
    <>
      <Navbar />
      <main>
        <section className="section-band contact-section request-page-section">
          <div className="container">
            <div className="contact-panel">
              <div>
                <p className="eyebrow">Hablemos</p>
                <h1>Solicita tu paquete audiovisual con BRUMA.</h1>
                <p>Cuéntanos qué vendes, qué redes usas y qué servicio necesitas. Te responderemos con disponibilidad, paquete sugerido y siguientes pasos.</p>
                <div className="contact-info"><span>Email: reemplazar por correo real</span><span>WhatsApp: reemplazar por número real</span></div>
                <AppLink className="request-back-link" href="/">Volver al inicio</AppLink>
              </div>
              <ContactForm selectedPackage={selectedPackage} onPackageChange={setSelectedPackage} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
