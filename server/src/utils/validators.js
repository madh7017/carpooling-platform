const namePattern = /^[A-Za-z][A-Za-z\s.'-]{1,49}$/;
const placePattern = /^(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9\s,.'-]{2,59}$/;
const licensePattern = /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9\s-]{6,20}$/;
const supportSubjectPattern = /^(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9\s,.'#&()/-]{4,79}$/;
const descriptiveTextPattern = /^(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9\s,.'#&()!?:/-]{9,500}$/;
const safetyNotePattern = /^(?=.*[A-Za-z])[A-Za-z0-9\s,.'#&()!?:/@+-]{2,300}$/;

const normalizeVehicleNumber = (value = "") => String(value).toUpperCase().replace(/[\s-]/g, "");
const normalizePhoneNumber = (value = "") => String(value).replace(/[^\d+]/g, "");
const vehiclePattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{3,4}$/;

const isValidName = (value = "") => namePattern.test(String(value).trim());
const isValidPlace = (value = "") => placePattern.test(String(value).trim());
const isValidPhone = (value = "") => {
  const normalized = normalizePhoneNumber(value).replace(/^\+/, "");

  if (/^[6-9]\d{9}$/.test(normalized)) return true;
  if (/^91[6-9]\d{9}$/.test(normalized)) return true;

  return false;
};
const isValidLicenseNumber = (value = "") => licensePattern.test(String(value).trim());
const isValidVehicleNumber = (value = "") => vehiclePattern.test(normalizeVehicleNumber(value));
const isValidSupportSubject = (value = "") => supportSubjectPattern.test(String(value).trim());
const isValidDescriptiveText = (value = "") => descriptiveTextPattern.test(String(value).trim());
const isValidSafetyNote = (value = "") => safetyNotePattern.test(String(value).trim());

module.exports = {
  isValidName,
  isValidPlace,
  isValidPhone,
  isValidLicenseNumber,
  isValidVehicleNumber,
  isValidSupportSubject,
  isValidDescriptiveText,
  isValidSafetyNote,
  normalizeVehicleNumber,
};
