import { useRef, useState } from 'react'

const initialForm = { name: '', brand: '', package: '', contact: '', message: '', ownerId: '' }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+?[0-9][0-9 ()-]{6,19}$/
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function ContactForm({ selectedPackage, onPackageChange, onSubmitRequest, canAssignOwner = false, defaultOwnerId = '' }) {
  const [form, setForm] = useState(() => ({ ...initialForm, ownerId: defaultOwnerId }))
  const [response, setResponse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submissionLock = useRef(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (name === 'package') onPackageChange(value)
    if (response) setResponse('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submissionLock.current) return
    setResponse('')

    const values = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      package: (selectedPackage || form.package).trim(),
      contact: form.contact.trim(),
      message: form.message.trim(),
      ownerId: form.ownerId.trim(),
    }
    const contactIsValid = emailPattern.test(values.contact) || phonePattern.test(values.contact)

    if (!values.name || !values.brand || !values.package || !values.contact || !values.message) {
      setResponse('Completa todos los campos antes de enviar.')
      return
    }
    if (values.name.length > 120 || values.brand.length > 120 || values.message.length > 3000) {
      setResponse('Revisa la longitud de los campos e inténtalo nuevamente.')
      return
    }
    if (!contactIsValid || values.contact.length > 254) {
      setResponse('Ingresa un correo electrónico o número de teléfono válido.')
      return
    }
    if (canAssignOwner && !uuidPattern.test(values.ownerId)) {
      setResponse('Ingresa un UUID válido para el cliente propietario.')
      return
    }

    submissionLock.current = true
    setIsSubmitting(true)
    try {
      await onSubmitRequest({
        nombre_cliente: values.name,
        nombre_emprendimiento: values.brand,
        contacto: values.contact,
        tipo_servicio: values.package,
        mensaje: values.message,
        ...(canAssignOwner ? { cliente_id: values.ownerId } : {}),
      })

      setResponse('Solicitud recibida. BRUMA te contactará para coordinar el servicio.')
      setForm({ ...initialForm, ownerId: canAssignOwner ? defaultOwnerId : '' })
      onPackageChange('')
    } catch (error) {
      setResponse(error.message || 'No se pudo guardar la solicitud. Inténtalo nuevamente.')
    } finally {
      submissionLock.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label htmlFor="contact-name" className="form-label">Nombre</label>
          <input className="form-control" id="contact-name" name="name" type="text" maxLength={120} placeholder="Tu nombre" value={form.name} onChange={updateField} required />
        </div>
        {canAssignOwner && (
          <div className="col-12">
            <label htmlFor="contact-owner" className="form-label">ID UUID del cliente propietario</label>
            <input className="form-control" id="contact-owner" name="ownerId" value={form.ownerId} onChange={updateField} required />
          </div>
        )}
        <div className="col-md-6">
          <label htmlFor="contact-brand" className="form-label">Emprendimiento</label>
          <input className="form-control" id="contact-brand" name="brand" type="text" maxLength={120} placeholder="Nombre de tu marca" value={form.brand} onChange={updateField} required />
        </div>
        <div className="col-md-6">
          <label htmlFor="contact-package" className="form-label">Servicio que necesita</label>
          <select className="form-select" id="contact-package" name="package" value={selectedPackage || form.package} onChange={updateField} required>
            <option value="">Selecciona una opción</option>
            <option>Bruma Base</option>
            <option>Bruma Impulso</option>
            <option>Bruma Pro</option>
            <option>No estoy seguro</option>
          </select>
        </div>
        <div className="col-md-6">
          <label htmlFor="contact-method" className="form-label">Número o correo</label>
          <input className="form-control" id="contact-method" name="contact" type="text" maxLength={254} placeholder="Tu número o correo" value={form.contact} onChange={updateField} required />
        </div>
        <div className="col-12">
          <label htmlFor="contact-message" className="form-label">Mensaje</label>
          <textarea className="form-control" id="contact-message" name="message" rows="4" maxLength={3000} placeholder="Cuéntanos qué necesitas publicar y deja tu WhatsApp o email" value={form.message} onChange={updateField} required />
        </div>
        <div className="col-12">
          <button className="btn btn-accent btn-lg w-100" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Trabajemos juntos'}
          </button>
        </div>
      </div>
      <p className="form-response" role="status" aria-live="polite">{response}</p>
    </form>
  )
}
