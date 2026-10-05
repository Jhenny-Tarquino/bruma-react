import Reveal from './Reveal.jsx'

export default function SectionHeading({ eyebrow, title, children, align = 'center' }) {
  return (
    <Reveal className={`section-heading${align === 'start' ? ' text-start' : ''}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </Reveal>
  )
}
