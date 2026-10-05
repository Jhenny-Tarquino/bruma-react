import Brand from './Brand.jsx'
import AppLink from './AppLink.jsx'
import { sectionPaths } from '../routes.js'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <AppLink className="brand-mark" href="/"><Brand /></AppLink>
          <p>Agencia audiovisual para emprendimientos y marcas que quieren crecer en redes.</p>
          <div className="footer-links">
            <AppLink href={sectionPaths.servicios}>Servicios</AppLink>
            <AppLink href={sectionPaths.paquetes}>Paquetes</AppLink>
            <AppLink href={sectionPaths.contacto}>Contacto</AppLink>
          </div>
        </div>
      </div>
    </footer>
  )
}
