const namePattern = /^[A-Za-z][A-Za-z\s.'-]{1,49}$/
const placePattern = /^(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9\s,.'-]{2,59}$/
const subjectPattern = /^(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9\s,.'#&()/-]{4,79}$/
const strongTextPattern = /^(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9\s,.'#&()!?:/-]{9,500}$/
const safetyNotePattern = /^(?=.*[A-Za-z])[A-Za-z0-9\s,.'#&()!?:/@+-]{2,300}$/
const licensePattern = /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9\s-]{6,20}$/

const normalizeVehicleNumber = (value = '') => String(value).toUpperCase().replace(/[\s-]/g, '')
const normalizePhoneNumber = (value = '') => String(value).replace(/[^\d+]/g, '')
const vehiclePattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{3,4}$/

export const isValidName = (value) => namePattern.test(String(value || '').trim())
export const isValidPlace = (value) => placePattern.test(String(value || '').trim())
export const isValidPhone = (value) => {
  const normalized = normalizePhoneNumber(value).replace(/^\+/, '')

  if (/^[6-9]\d{9}$/.test(normalized)) return true
  if (/^91[6-9]\d{9}$/.test(normalized)) return true

  return false
}
export const isValidLicenseNumber = (value) => licensePattern.test(String(value || '').trim())
export const isValidVehicleNumber = (value) => vehiclePattern.test(normalizeVehicleNumber(value))
export const isValidSupportSubject = (value) => subjectPattern.test(String(value || '').trim())
export const isValidDescriptiveText = (value) => strongTextPattern.test(String(value || '').trim())
export const isValidSafetyNote = (value) => safetyNotePattern.test(String(value || '').trim())
export const normalizedVehicleNumber = normalizeVehicleNumber
