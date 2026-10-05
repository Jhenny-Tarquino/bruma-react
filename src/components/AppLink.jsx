import { Link } from 'react-router-dom'

const externalHref = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i

export default function AppLink({ href, target, download, ...props }) {
  const preserveBrowserNavigation =
    externalHref.test(href) ||
    !href?.startsWith('/') ||
    download !== undefined ||
    (target !== undefined && target !== '_self')

  if (preserveBrowserNavigation) {
    return <a href={href} target={target} download={download} {...props} />
  }

  return <Link to={href} target={target} download={download} {...props} />
}
