export const appRoutes = [
  { path: '/', section: 'inicio' },
  { path: '/servicios', section: 'servicios' },
  { path: '/showreel', section: 'showreel' },
  { path: '/bruma', section: 'bruma' },
  { path: '/paquetes', section: 'paquetes' },
  { path: '/comparar', section: 'comparar' },
  { path: '/proceso', section: 'proceso' },
  { path: '/confianza', section: 'confianza' },
  { path: '/contacto', section: 'contacto' },
]

export const sectionPaths = Object.fromEntries(
  appRoutes.map(({ path, section }) => [section, path]),
)
