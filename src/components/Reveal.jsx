import { useEffect, useRef, useState } from 'react'

export default function Reveal({ as: Element = 'div', className = '', children, ...props }) {
  const elementRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current

    if (!element || !('IntersectionObserver' in window)) {
      setVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <Element
      {...props}
      ref={elementRef}
      className={`reveal${visible ? ' visible' : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </Element>
  )
}
