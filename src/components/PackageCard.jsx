import Reveal from './Reveal.jsx'
import AppLink from './AppLink.jsx'
import { sectionPaths } from '../routes.js'

export default function PackageCard({ packageInfo, onSelect }) {
  const { name, tag, description, price, summary, features, action, featured } = packageInfo

  return (
    <Reveal as="article" className={`package-card${featured ? ' featured' : ''}`}>
        {featured && <div className="popular-badge">Más elegido</div>}
        <div className="package-top">
          <span className="package-tag">{tag}</span>
          <h3>{name}</h3>
          <p>{description}</p>
        </div>
        <div className="price"><span>$</span>{price}</div>
        <div className="package-summary" aria-label={`Resumen ${name}`}>
          {summary.map((item) => <span key={item}>{item}</span>)}
        </div>
        <ul className="feature-list">
          {features.map((feature) => <li key={feature}>{feature}</li>)}
        </ul>
        <AppLink
          className={`btn${featured ? ' btn-accent' : ' btn-package'} btn-package`}
          href={sectionPaths.contacto}
          onClick={() => onSelect(name)}
        >
          {action}
        </AppLink>
    </Reveal>
  )
}
