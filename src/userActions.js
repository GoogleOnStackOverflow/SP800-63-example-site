// Event names
const userActions = {
// LOGIN RECORDS
  PWD_LOGIN_SUCCESS: 'PWD_LOGIN_SUCCESS',
  OTP_LOGIN_SUCCESS: 'OTP_LOGIN_SUCCESS',
  PWD_LOGIN_FAILED: 'PWD_LOGIN_FAILED',
  OTP_LOGIN_FAILED: 'OTP_LOGIN_FAILED',

// Enrollment
  EMAIL_VERIFICATION_SENT: 'EMAIL_VERIFICATION_SENT',
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',
  PHONE_VERIFIED: 'PHONE_VERIFIED',
  EVIDENCE_UPLOADED: 'EVIDENCE_UPLOADED',
  EVIDENCE_VERIFIED: 'EVIDENCE_VERIFIED',
  PII_EDITED: 'PII_EDITED',
  PII_VERIFIED: 'PII_VERIFIED',

// Authenticator Lifecycle
  PWD_RESET_REQ: 'PWD_RESET_REQ',
  PWD_RESET: 'PWD_RESET',
  OTP_DELIVERIED: 'OTP_DELIVERIED',
  OTP_RESET_REQ: 'OTP_RESET_REQ',
  OTP_RESET: 'OTP_RESET',
}

export default userActions;