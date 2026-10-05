import CallToAction from './CallToAction.jsx'
import Reveal from './Reveal.jsx'

export default function HeroSection() {
  return (
    <section className="hero section-band" id="inicio">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <Reveal as="p" className="eyebrow">Contenido audiovisual para emprendimientos</Reveal>
            <Reveal as="h1" className="hero-brand-name">BRUMA</Reveal>
            <Reveal as="p" className="hero-title">Convierte tus ideas en contenido que se ve, se entiende y se publica.</Reveal>
            <Reveal as="p" className="hero-copy">Agencia audiovisual para marcas pequeñas que necesitan grabación, fotografía, edición y dirección creativa en paquetes claros, con precio definido y piezas listas para redes.</Reveal>
            <CallToAction
              className="hero-actions"
              actions={[
                { label: 'Ver paquetes', href: '#paquetes' },
                { label: 'Ver cómo trabajamos', href: '#proceso', variant: 'ghost' },
              ]}
            />
            <Reveal className="hero-stats" aria-label="Resumen de beneficios">
              <div><strong>3</strong><span>paquetes simples</span></div>
              <div><strong>48h</strong><span>primer corte*</span></div>
              <div><strong>1</strong><span>plan claro de contenido</span></div>
            </Reveal>
            <Reveal as="p" className="hero-note">*Primer corte en 48h. La entrega final depende del paquete y las rondas de ajustes.</Reveal>
          </div>
          <div className="col-lg-6">
            <Reveal className="hero-visual">
              <img src={`${import.meta.env.BASE_URL}bruma-studio.svg`} alt="Set audiovisual moderno con cámara, luz y piezas de contenido para redes" />
              <div className="floating-card floating-card-top"><span>Reels</span><strong>8 piezas</strong></div>
              <div className="floating-card floating-card-bottom"><span>Paquetes desde</span><strong>$180</strong></div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
