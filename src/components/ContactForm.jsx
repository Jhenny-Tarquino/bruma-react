import { useState } from 'react'

const initialForm = { name: '', brand: '', package: '', contact: '', message: '' }

export default function ContactForm({ selectedPackage, onPackageChange }) {
  const [form, setForm] = useState(initialForm)
  const [response, setResponse] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (name === 'package') onPackageChange(value)
    if (response) setResponse('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    setResponse('Solicitud recibida. BRUMA te contactará para coordinar el servicio.')
    setForm(initialForm)
    onPackageChange('')
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label htmlFor="contact-name" className="form-label">Nombre</label>
          <input className="form-control" id="contact-name" name="name" type="text" placeholder="Tu nombre" value={form.name} onChange={updateField} required />
        </div>
        <div className="col-md-6">
          <label htmlFor="contact-brand" className="form-label">Emprendimiento</label>
          <input className="form-control" id="contact-brand" name="brand" type="text" placeholder="Nombre de tu marca" value={form.brand} onChange={updateField} required />
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
          <input className="form-control" id="contact-method" name="contact" type="text" placeholder="Tu número o correo" value={form.contact} onChange={updateField} required />
        </div>
        <div className="col-12">
          <label htmlFor="contact-message" className="form-label">Mensaje</label>
          <textarea className="form-control" id="contact-message" name="message" rows="4" placeholder="Cuéntanos qué necesitas publicar y deja tu WhatsApp o email" value={form.message} onChange={updateField} required />
        </div>
        <div className="col-12">
          <button className="btn btn-accent btn-lg w-100" type="submit">Trabajemos juntos</button>
        </div>
      </div>
      <p className="form-response" role="status" aria-live="polite">{response}</p>
    </form>
  )
}
