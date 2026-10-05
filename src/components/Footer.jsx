import Brand from './Brand.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <a className="brand-mark" href="#inicio"><Brand /></a>
          <p>Agencia audiovisual para emprendimientos y marcas que quieren crecer en redes.</p>
          <div className="footer-links">
            <a href="#servicios">Servicios</a>
            <a href="#paquetes">Paquetes</a>
            <a href="#contacto">Contacto</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
