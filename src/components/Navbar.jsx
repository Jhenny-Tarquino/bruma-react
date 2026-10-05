import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { sectionPaths } from '../routes.js'
import AppLink from './AppLink.jsx'
import Brand from './Brand.jsx'

const links = [
  ['Servicios', sectionPaths.servicios],
  ['Showreel', sectionPaths.showreel],
  ['Paquetes', sectionPaths.paquetes],
  ['Comparar', sectionPaths.comparar],
  ['Proceso', sectionPaths.proceso],
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <nav className="bruma-navbar" aria-label="Navegación principal">
      <div className="container navbar-content">
        <AppLink className="brand-mark" href="/" aria-label="BRUMA, inicio" onClick={closeMenu}>
          <Brand />
        </AppLink>
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
                <AppLink className={`nav-link${pathname === href ? ' active' : ''}`} href={href} aria-current={pathname === href ? 'page' : undefined} onClick={closeMenu}>{label}</AppLink>
              </li>
            ))}
            <li>
              <AppLink className="btn btn-accent nav-cta" href={sectionPaths.contacto} onClick={closeMenu}>
                Solicitar servicio
              </AppLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
