import Reveal from './Reveal.jsx'

export default function ProcessStep({ number, title, description }) {
  return (
    <Reveal as="article" className="process-step">
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </Reveal>
  )
}
