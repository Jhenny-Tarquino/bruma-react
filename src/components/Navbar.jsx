import { useState } from 'react'
import Brand from './Brand.jsx'

const links = [
  ['Servicios', '#servicios'],
  ['Showreel', '#showreel'],
  ['Paquetes', '#paquetes'],
  ['Comparar', '#comparar'],
  ['Proceso', '#proceso'],
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <nav className="bruma-navbar" aria-label="Navegación principal">
      <div className="container navbar-content">
        <a className="brand-mark" href="#inicio" aria-label="BRUMA, inicio" onClick={closeMenu}>
          <Brand />
        </a>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="mainNavbar"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="navbar-toggler-icon" aria-hidden="true" />
        </button>
        <div className={`navbar-collapse${menuOpen ? ' show' : ''}`} id="mainNavbar">
          <ul className="navbar-nav">
            {links.map(([label, href]) => (
              <li key={href}>
                <a className="nav-link" href={href} onClick={closeMenu}>{label}</a>
              </li>
            ))}
            <li>
              <a className="btn btn-accent nav-cta" href="#contacto" onClick={closeMenu}>
                Solicitar servicio
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
