import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const requiredVariables = [
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'RLS_TEST_A_EMAIL',
  'RLS_TEST_A_PASSWORD',
  'RLS_TEST_B_EMAIL',
  'RLS_TEST_B_PASSWORD',
  'RLS_TEST_STAFF_EMAIL',
  'RLS_TEST_STAFF_PASSWORD',
  'RLS_TEST_ADMIN_EMAIL',
  'RLS_TEST_ADMIN_PASSWORD',
]
const missingVariables = requiredVariables.filter((name) => !process.env[name])
if (missingVariables.length) {
  throw new Error(`Missing variables in .env.rls-test: ${missingVariables.join(', ')}`)
}

const supabaseUrl = process.env.SUPABASE_URL
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
const runId = randomUUID()
const requestTable = 'solicitudes'
const selectedColumns = 'id_solicitud, cliente_id, nombre_cliente, contacto, tipo_servicio, mensaje, fecha_solicitud, estado'

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

async function signIn(email, password, label) {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`${label} could not sign in: ${error.message}`)
  return { client, user: data.user }
}

function payload(label) {
  return {
    nombre_cliente: `Prueba ${label}`,
    contacto: `${label.toLowerCase()}-${runId}@example.invalid`,
    tipo_servicio: 'Bruma Base',
    mensaje: `[PRUEBA RLS ${runId}] Solicitud temporal de verificación.`,
  }
}

async function createOwnRequest(client, user, label) {
  const { data, error } = await client
    .from(requestTable)
    .insert(payload(label))
    .select(selectedColumns)
    .single()
  if (error) throw new Error(`${label} could not create its request: ${error.message}`)
  assert(data.cliente_id === user.id, `${label} insert defaults cliente_id to its authenticated user`)
  return data
}

const accountA = await signIn(process.env.RLS_TEST_A_EMAIL, process.env.RLS_TEST_A_PASSWORD, 'Account A')
const accountB = await signIn(process.env.RLS_TEST_B_EMAIL, process.env.RLS_TEST_B_PASSWORD, 'Account B')
const staff = await signIn(process.env.RLS_TEST_STAFF_EMAIL, process.env.RLS_TEST_STAFF_PASSWORD, 'BRUMA staff')
const admin = await signIn(process.env.RLS_TEST_ADMIN_EMAIL, process.env.RLS_TEST_ADMIN_PASSWORD, 'BRUMA admin')

if (accountA.user.id === accountB.user.id) throw new Error('Test accounts A and B must be independent.')
if (staff.user.app_metadata?.bruma_role !== 'staff') {
  throw new Error('The staff account must have app_metadata.bruma_role = "staff" assigned outside the client.')
}
if (admin.user.app_metadata?.bruma_role !== 'admin') {
  throw new Error('The admin account must have app_metadata.bruma_role = "admin" assigned outside the client.')
}
if (['staff', 'admin'].includes(accountA.user.app_metadata?.bruma_role)
  || ['staff', 'admin'].includes(accountB.user.app_metadata?.bruma_role)) {
  throw new Error('Accounts A and B must be ordinary client accounts.')
}

const requestA = await createOwnRequest(accountA.client, accountA.user, 'A')
const requestB = await createOwnRequest(accountB.client, accountB.user, 'B')

for (const [label, account, ownRequest, otherRequest] of [
  ['A', accountA, requestA, requestB],
  ['B', accountB, requestB, requestA],
]) {
  const { data: ownRows, error: ownError } = await account.client
    .from(requestTable)
    .select('id_solicitud, cliente_id')
    .eq('id_solicitud', ownRequest.id_solicitud)
  if (ownError) throw new Error(`Account ${label} own SELECT failed: ${ownError.message}`)
  assert(ownRows.length === 1 && ownRows[0].cliente_id === account.user.id, `${label} can read its own request`)

  const { data: foreignRows, error: foreignError } = await account.client
    .from(requestTable)
    .select('id_solicitud')
    .eq('id_solicitud', otherRequest.id_solicitud)
  if (foreignError) throw new Error(`Account ${label} foreign SELECT failed unexpectedly: ${foreignError.message}`)
  assert(foreignRows.length === 0, `${label} cannot read the other account's request`)

  const { error: forgedOwnerError } = await account.client
    .from(requestTable)
    .insert({ ...payload(`${label}-forged`), cliente_id: otherRequest.cliente_id })
  assert(forgedOwnerError?.code === '42501', `${label} cannot insert a request owned by the other account`)

  const { error: blankNameError } = await account.client
    .from(requestTable)
    .insert({ ...payload(`${label}-blank-name`), nombre_cliente: '   ' })
  assert(blankNameError?.code === '23514', `${label} cannot save a name made only of spaces`)

  const { error: whitespaceNameError } = await account.client
    .from(requestTable)
    .insert({ ...payload(`${label}-whitespace-name`), nombre_cliente: '\t\n  ' })
  assert(whitespaceNameError?.code === '23514', `${label} cannot save a name made only of whitespace`)

  const { error: invalidContactError } = await account.client
    .from(requestTable)
    .insert({ ...payload(`${label}-invalid-contact`), contacto: 'not a valid contact' })
  assert(invalidContactError?.code === '23514', `${label} cannot save an invalid contact`)

  const { data: updatedRows, error: clientUpdateError } = await account.client
    .from(requestTable)
    .update({ estado: 'aceptada' })
    .eq('id_solicitud', ownRequest.id_solicitud)
    .select('id_solicitud')
  if (clientUpdateError) {
    assert(clientUpdateError.code === '42501', `${label} cannot update a request`)
  } else {
    assert(updatedRows.length === 0, `${label} cannot update a request`)
  }

  const { data: deletedRows, error: clientDeleteError } = await account.client
    .from(requestTable)
    .delete()
    .eq('id_solicitud', ownRequest.id_solicitud)
    .select('id_solicitud')
  if (clientDeleteError) {
    assert(clientDeleteError.code === '42501', `${label} cannot delete a request`)
  } else {
    assert(deletedRows.length === 0, `${label} cannot delete a request`)
  }
}

const { data: staffRows, error: staffReadError } = await staff.client
  .from(requestTable)
  .select('id_solicitud')
  .in('id_solicitud', [requestA.id_solicitud, requestB.id_solicitud])
if (staffReadError) throw new Error(`Staff SELECT failed: ${staffReadError.message}`)
assert(staffRows.length === 2, 'BRUMA staff can read requests from both clients')

const { error: staffInsertError } = await staff.client
  .from(requestTable)
  .insert(payload('staff-forbidden'))
assert(staffInsertError?.code === '42501', 'BRUMA staff cannot create requests')

const { data: staffDeletedRows, error: staffDeleteError } = await staff.client
  .from(requestTable)
  .delete()
  .eq('id_solicitud', requestA.id_solicitud)
  .select('id_solicitud')
if (staffDeleteError) {
  assert(staffDeleteError.code === '42501', 'BRUMA staff cannot delete requests')
} else {
  assert(staffDeletedRows.length === 0, 'BRUMA staff cannot delete requests')
}

const { data: changedStatus, error: statusError } = await staff.client
  .from(requestTable)
  .update({ estado: 'en proceso' })
  .eq('id_solicitud', requestA.id_solicitud)
  .select('id_solicitud, estado')
  .single()
if (statusError) throw new Error(`Staff could not change estado: ${statusError.message}`)
assert(changedStatus.estado === 'en proceso', 'BRUMA staff can update estado')

const forbiddenUpdates = [
  ['nombre_cliente', { nombre_cliente: 'Nombre alterado' }],
  ['contacto', { contacto: `changed-${runId}@example.invalid` }],
  ['tipo_servicio', { tipo_servicio: 'Bruma Pro' }],
  ['mensaje', { mensaje: 'Mensaje alterado' }],
  ['fecha_solicitud', { fecha_solicitud: new Date(0).toISOString() }],
  ['cliente_id', { cliente_id: accountB.user.id }],
  ['id_solicitud', { id_solicitud: randomUUID() }],
]
for (const [field, changes] of forbiddenUpdates) {
  const { error } = await staff.client
    .from(requestTable)
    .update(changes)
    .eq('id_solicitud', requestA.id_solicitud)
    .select('id_solicitud')
  assert(error?.code === '42501', `BRUMA staff cannot update ${field}`)
}

const { data: unchanged, error: verifyError } = await staff.client
  .from(requestTable)
  .select('id_solicitud, cliente_id, contacto, estado')
  .eq('id_solicitud', requestA.id_solicitud)
  .single()
if (verifyError) throw new Error(`Could not verify protected fields: ${verifyError.message}`)
assert(unchanged.cliente_id === accountA.user.id, 'Rejected staff updates did not change the owner')
assert(unchanged.contacto === requestA.contacto, 'Rejected staff updates did not change client contact')
assert(unchanged.estado === 'en proceso', 'The allowed staff status update persisted')

const { data: adminRequest, error: adminInsertError } = await admin.client
  .from(requestTable)
  .insert({ ...payload('admin'), cliente_id: accountA.user.id })
  .select(selectedColumns)
  .single()
if (adminInsertError) throw new Error(`Admin INSERT failed: ${adminInsertError.message}`)
assert(adminRequest.cliente_id === accountA.user.id, 'BRUMA admin can create a request for a specified client')

const { data: adminRows, error: adminReadError } = await admin.client
  .from(requestTable)
  .select('id_solicitud')
  .in('id_solicitud', [requestA.id_solicitud, requestB.id_solicitud, adminRequest.id_solicitud])
if (adminReadError) throw new Error(`Admin SELECT failed: ${adminReadError.message}`)
assert(adminRows.length === 3, 'BRUMA admin can read all test requests')

const { data: adminUpdated, error: adminUpdateError } = await admin.client
  .from(requestTable)
  .update({ cliente_id: accountB.user.id, nombre_cliente: 'Admin editado', estado: 'aceptada' })
  .eq('id_solicitud', adminRequest.id_solicitud)
  .select('id_solicitud, cliente_id, nombre_cliente, estado')
  .single()
if (adminUpdateError) throw new Error(`Admin UPDATE failed: ${adminUpdateError.message}`)
assert(adminUpdated.cliente_id === accountB.user.id && adminUpdated.nombre_cliente === 'Admin editado', 'BRUMA admin can update request data')

const { data: removedRows, error: adminDeleteError } = await admin.client
  .from(requestTable)
  .delete()
  .in('id_solicitud', [requestA.id_solicitud, requestB.id_solicitud, adminRequest.id_solicitud])
  .select('id_solicitud')
if (adminDeleteError) throw new Error(`Admin DELETE failed: ${adminDeleteError.message}`)
assert(removedRows.length === 3, 'BRUMA admin can delete all test requests')

console.log(`All CRUD/RLS checks passed for run ${runId}; generated test rows were removed by the admin session.`)
