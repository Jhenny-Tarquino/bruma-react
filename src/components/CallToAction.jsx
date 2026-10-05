import Reveal from './Reveal.jsx'
import AppLink from './AppLink.jsx'

export default function CallToAction({ eyebrow, title, actions, className }) {
  return (
    <Reveal className={className}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      {title && <h2>{title}</h2>}
      {actions.map(({ label, href, variant = 'accent' }) => (
        <AppLink className={`btn btn-${variant} btn-lg`} href={href} key={href}>{label}</AppLink>
      ))}
    </Reveal>
  )
}
