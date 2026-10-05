import Reveal from './Reveal.jsx'

export default function ServiceCard({ number, title, description }) {
  return (
    <Reveal as="article" className="service-card">
      <div className="icon-pill">{number}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </Reveal>
  )
}
