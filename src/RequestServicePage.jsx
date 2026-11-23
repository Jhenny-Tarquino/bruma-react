import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ContactForm from './components/ContactForm.jsx'
import Footer from './components/Footer.jsx'
import Navbar from './components/Navbar.jsx'
import AppLink from './components/AppLink.jsx'
import { publicSupabase, supabase, supabaseConfigured } from './lib/supabaseClient.js'
import './App.css'

const requestStatuses = ['pendiente', 'en proceso', 'aceptada', 'rechazada']
export default function RequestServicePage() {
  const { search } = useLocation()
  const [selectedPackage, setSelectedPackage] = useState(
    () => new URLSearchParams(search).get('package') ?? '',
  )
  const [authView, setAuthView] = useState(
    () => new URLSearchParams(search).get('mode') === 'login',
  )
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(Boolean(supabase))
  const [authMode, setAuthMode] = useState('login')
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [authMessage, setAuthMessage] = useState('')
  const [authPending, setAuthPending] = useState(false)
  const [requests, setRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requestsError, setRequestsError] = useState('')
  const [updatingRequest, setUpdatingRequest] = useState('')

  const user = session?.user ?? null
  const isAnonymous = user?.is_anonymous === true
  const isRegisteredUser = Boolean(user && !isAnonymous)
  const role = user?.app_metadata?.bruma_role ?? 'client'
  const hasKnownRole = ['client', 'staff', 'admin'].includes(role)
  const canAccessPanel = isRegisteredUser && hasKnownRole
  const canManageRequests = canAccessPanel && (role === 'staff' || role === 'admin')
  const canCreateRequests = !user || isAnonymous || (canAccessPanel && (role === 'client' || role === 'admin'))
  const roleLabel = role === 'staff' ? 'Personal BRUMA' : role === 'admin' ? 'Administrador' : role === 'client' ? 'Cliente' : 'Sin acceso asignado'

  useEffect(() => {
    if (!supabase) return undefined

    let mounted = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) setAuthMessage(error.message)
      setSession(data.session)
      setAuthLoading(false)
    }).catch((error) => {
      if (!mounted) return
      setAuthMessage(error.message || 'No se pudo comprobar la sesión.')
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthMessage('')
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const loadRequests = useCallback(async () => {
    if (!supabase || !canAccessPanel) return

    setRequestsLoading(true)
    setRequestsError('')
    try {
      const { data, error } = await supabase
        .from('solicitudes')
        .select('id_solicitud, cliente_id, nombre_cliente, nombre_emprendimiento, contacto, tipo_servicio, mensaje, fecha_solicitud, estado')
        .order('fecha_solicitud', { ascending: false })

      if (error) throw error
      setRequests(data ?? [])
    } catch (error) {
      setRequestsError(error.message || 'No se pudieron cargar las solicitudes.')
    } finally {
      setRequestsLoading(false)
    }
  }, [canAccessPanel, role, user?.id])

  useEffect(() => {
    if (canAccessPanel) {
      loadRequests()
    } else {
      setRequests([])
      setRequestsError('')
    }
  }, [canAccessPanel, loadRequests])

  useEffect(() => {
    if (!supabase || !canAccessPanel) return undefined

    const channel = supabase
      .channel(`solicitudes-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'solicitudes',
      }, () => loadRequests())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [canAccessPanel, loadRequests, user?.id])

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setAuthMessage('')
    setAuthPending(true)

    try {
      const action = authMode === 'login'
        ? supabase.auth.signInWithPassword(credentials)
        : supabase.auth.signUp(credentials)
      const { data, error } = await action
      if (error) throw error

      if (authMode === 'signup' && !data.session) {
        setAuthMessage('Revisa tu correo para confirmar la cuenta antes de iniciar sesión.')
      } else {
        setAuthView(false)
        setAuthMessage('Sesión iniciada.')
      }
    } catch (error) {
      setAuthMessage(error.message || 'No se pudo completar la autenticación.')
    } finally {
      setAuthPending(false)
    }
  }

  async function handleSignOut() {
    setAuthView(false)
    const { error } = await supabase.auth.signOut()
    setAuthMessage(error?.message ?? '')
  }

  async function saveRequest(values) {
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError

    const currentUser = currentSession?.user
    const isRegistered = Boolean(currentUser && !currentUser.is_anonymous)
    const isAdmin = isRegistered && currentUser.app_metadata?.bruma_role === 'admin'
    const requestClient = isRegistered ? supabase : publicSupabase
    const requestValues = {
      nombre_cliente: values.nombre_cliente,
      nombre_emprendimiento: values.nombre_emprendimiento,
      contacto: values.contacto,
      tipo_servicio: values.tipo_servicio,
      mensaje: values.mensaje,
      ...(isRegistered
        ? { cliente_id: isAdmin ? (values.cliente_id || currentUser.id) : currentUser.id }
        : {}),
    }

    const { error } = await requestClient
      .from('solicitudes')
      .insert(requestValues)

    if (error) throw error
    if (isRegistered && (currentUser.app_metadata?.bruma_role === 'client' || isAdmin)) {
      await loadRequests()
    }
  }

  async function updateRequestStatus(requestId, estado) {
    setUpdatingRequest(requestId)
    setRequestsError('')
    try {
      const { data, error } = await supabase
        .from('solicitudes')
        .update({ estado })
        .eq('id_solicitud', requestId)
        .select('id_solicitud')
        .maybeSingle()

      if (error) throw error
      if (!data) {
        setRequestsError('La solicitud no existe o no tienes permiso para actualizarla.')
        return
      }
      await loadRequests()
    } catch (error) {
      setRequestsError(error.message || 'No se pudo actualizar el estado.')
    } finally {
      setUpdatingRequest('')
    }
  }

  async function updateRequest(requestId, values) {
    setUpdatingRequest(requestId)
    setRequestsError('')
    try {
      const { data, error } = await supabase
        .from('solicitudes')
        .update(values)
        .eq('id_solicitud', requestId)
        .select('id_solicitud')
        .maybeSingle()

      if (error) throw error
      if (!data) {
        setRequestsError('La solicitud no existe o no tienes permiso para actualizarla.')
        return { error: new Error('No se actualizó ninguna solicitud.') }
      }
      await loadRequests()
      return { data }
    } catch (error) {
      setRequestsError(error.message || 'No se pudo actualizar la solicitud.')
      return { error }
    } finally {
      setUpdatingRequest('')
    }
  }

  async function deleteRequest(requestId) {
    setUpdatingRequest(requestId)
    setRequestsError('')
    try {
      const { data, error } = await supabase
        .from('solicitudes')
        .delete()
        .eq('id_solicitud', requestId)
        .select('id_solicitud')
        .maybeSingle()

      if (error) throw error
      if (!data) {
        setRequestsError('La solicitud no existe o no tienes permiso para eliminarla.')
        return { error: new Error('No se eliminó ninguna solicitud.') }
      }
      await loadRequests()
      return { data }
    } catch (error) {
      setRequestsError(error.message || 'No se pudo eliminar la solicitud.')
      return { error }
    } finally {
      setUpdatingRequest('')
    }
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="section-band contact-section request-page-section">
          <div className="container">
            <div className="contact-panel request-panel">
              <div>
                <p className="eyebrow">Hablemos</p>
                <h1>Solicita tu paquete audiovisual con BRUMA.</h1>
                <p>Cuéntanos qué vendes, qué redes usas y qué servicio necesitas. Te responderemos con disponibilidad, paquete sugerido y siguientes pasos.</p>
                <div className="contact-info"><span>Email: reemplazar por correo real</span><span>WhatsApp: reemplazar por número real</span></div>
                {isRegisteredUser ? (
                  <div className="account-summary">
                    <p>Cuenta: <strong>{user.email || 'BRUMA'}</strong> · {roleLabel}</p>
                    <button className="btn btn-ghost" type="button" onClick={handleSignOut}>Cerrar sesión</button>
                  </div>
                ) : isAnonymous ? (
                  <div className="account-summary">
                    <p>Visitante · puedes enviar tu consulta sin crear una cuenta.</p>
                  </div>
                ) : (
                  <AppLink className="request-back-link" href="/">Volver al inicio</AppLink>
                )}
              </div>

              {!supabaseConfigured ? (
                <p className="integration-notice">Conecta el proyecto Supabase en el archivo local .env.local para iniciar sesión y enviar solicitudes.</p>
              ) : authLoading ? (
                <p role="status">Comprobando sesión...</p>
              ) : authView && !isRegisteredUser ? (
                <form className="contact-form auth-form" onSubmit={handleAuthSubmit}>
                  <h2>{authMode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}</h2>
                  <div className="row g-3">
                    <div className="col-12">
                      <label htmlFor="auth-email" className="form-label">Correo electrónico</label>
                      <input className="form-control" id="auth-email" type="email" autoComplete="email" value={credentials.email} onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))} required />
                    </div>
                    <div className="col-12">
                      <label htmlFor="auth-password" className="form-label">Contraseña</label>
                      <input className="form-control" id="auth-password" type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={credentials.password} onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))} required />
                    </div>
                    <div className="col-12">
                      <button className="btn btn-accent btn-lg w-100" type="submit" disabled={authPending}>
                        {authPending ? 'Procesando...' : authMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                      </button>
                    </div>
                    <div className="col-12">
                      <button className="auth-mode-toggle" type="button" onClick={() => { setAuthMode((mode) => mode === 'login' ? 'signup' : 'login'); setAuthMessage('') }}>
                        {authMode === 'login' ? '¿Aún no tienes cuenta? Crear cuenta' : '¿Ya tienes cuenta? Iniciar sesión'}
                      </button>
                    </div>
                  </div>
                  <p className="form-response" role="status" aria-live="polite">{authMessage}</p>
                </form>
              ) : canCreateRequests ? (
                <ContactForm
                  selectedPackage={selectedPackage}
                  onPackageChange={setSelectedPackage}
                  onSubmitRequest={saveRequest}
                  canAssignOwner={canAccessPanel && role === 'admin'}
                  defaultOwnerId={user?.id ?? ''}
                />
              ) : (
                <p className="integration-notice">Tu cuenta de personal puede revisar y actualizar el estado de las solicitudes.</p>
              )}
            </div>

            {canAccessPanel && (
              <section className="account-requests" aria-labelledby="requests-heading">
                <div className="account-requests-heading">
                  <h2 id="requests-heading">{canManageRequests ? 'Solicitudes recibidas' : 'Mis solicitudes'}</h2>
                  {requestsLoading && <span role="status">Actualizando...</span>}
                </div>
                {requestsError && <p className="request-error" role="alert">{requestsError}</p>}
                {!requestsLoading && !requestsError && requests.length === 0 && (
                  <p className="request-empty">Aún no hay solicitudes para mostrar.</p>
                )}
                <div className="request-list">
                  {requests.map((request) => (
                    <article className="request-list-item" key={request.id_solicitud}>
                      <div className="request-list-details">
                        <p className="eyebrow">{request.tipo_servicio}</p>
                        {canManageRequests && <p><strong>{request.nombre_cliente}</strong> · {request.contacto}</p>}
                        {request.nombre_emprendimiento && <p>{request.nombre_emprendimiento}</p>}
                        <p>{request.mensaje}</p>
                        <small>{new Date(request.fecha_solicitud).toLocaleString()}</small>
                      </div>
                      <label className="request-status-control">
                        <span>Estado</span>
                        <select className="form-select" value={request.estado} disabled={!canManageRequests || updatingRequest === request.id_solicitud} onChange={(event) => updateRequestStatus(request.id_solicitud, event.target.value)}>
                          {requestStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </label>
                      {role === 'admin' && (
                        <AdminRequestControls
                          request={request}
                          disabled={updatingRequest === request.id_solicitud}
                          onSave={(values) => updateRequest(request.id_solicitud, values)}
                          onDelete={() => deleteRequest(request.id_solicitud)}
                        />
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function AdminRequestControls({ request, disabled, onSave, onDelete }) {
  const [values, setValues] = useState({ ...request })
  const [message, setMessage] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await onSave({
      cliente_id: values.cliente_id.trim(),
      nombre_cliente: values.nombre_cliente.trim(),
      nombre_emprendimiento: values.nombre_emprendimiento?.trim() ?? '',
      contacto: values.contacto.trim(),
      tipo_servicio: values.tipo_servicio.trim(),
      mensaje: values.mensaje.trim(),
      fecha_solicitud: values.fecha_solicitud,
      estado: values.estado,
    })
    setMessage(result.error ? result.error.message : 'Cambios guardados.')
  }

  async function handleDelete() {
    if (!window.confirm('¿Eliminar definitivamente esta solicitud?')) return
    const result = await onDelete()
    if (result.error) setMessage(result.error.message)
  }

  return (
    <details className="request-admin-controls">
      <summary>Administrar solicitud</summary>
      <form className="request-admin-form" onSubmit={handleSubmit}>
        <label>ID de solicitud
          <input className="form-control" value={values.id_solicitud} readOnly />
        </label>
        <label>ID del cliente
          <input className="form-control" name="cliente_id" value={values.cliente_id} onChange={updateField} required />
        </label>
        <label>Nombre
          <input className="form-control" name="nombre_cliente" value={values.nombre_cliente} onChange={updateField} maxLength={120} required />
        </label>
        <label>Emprendimiento
          <input className="form-control" name="nombre_emprendimiento" value={values.nombre_emprendimiento ?? ''} onChange={updateField} maxLength={120} />
        </label>
        <label>Contacto
          <input className="form-control" name="contacto" value={values.contacto} onChange={updateField} maxLength={254} required />
        </label>
        <label>Servicio
          <input className="form-control" name="tipo_servicio" value={values.tipo_servicio} onChange={updateField} maxLength={80} required />
        </label>
        <label>Fecha de solicitud (ISO 8601)
          <input className="form-control" name="fecha_solicitud" value={values.fecha_solicitud} onChange={updateField} required />
        </label>
        <label>Estado
          <select className="form-select" name="estado" value={values.estado} onChange={updateField}>
            {requestStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label className="request-admin-message">Mensaje
          <textarea className="form-control" name="mensaje" value={values.mensaje} onChange={updateField} maxLength={3000} required />
        </label>
        <div className="request-admin-actions">
          <button className="btn btn-accent" type="submit" disabled={disabled}>Guardar cambios</button>
          <button className="btn btn-ghost" type="button" onClick={handleDelete} disabled={disabled}>Eliminar solicitud</button>
        </div>
        <p role="status" aria-live="polite">{message}</p>
      </form>
    </details>
  )
}
