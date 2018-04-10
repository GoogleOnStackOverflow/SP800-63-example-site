export const LOADING = 'LOADING';
export const NOT_LOADING = 'NOT_LOADING';

export const HANDLE_VALUE_ONCHANGE = 'HANDLE_VALUE_ONCHANGE';

export const handleValueOnChange = (formName, value) => {
  return {
    type: HANDLE_VALUE_ONCHANGE,
    formName, value
  }
}

export const loading = () => {
  return {
    type: LOADING
  }
}

export const notLoading = () => {
  return {
    type: NOT_LOADING
  }
}

export const WEAK_PWD = 'WEAK_PWD';
export const OPEN_ALERT = 'OPEN_ALERT';
export const CLOSE_ALERT = 'CLOSE_ALERT';
export const OPEN_CHECK = 'OPEN_CHECK'
export const CLOSE_CHECK = 'CLOSE_CHECK';

export const weak = (weak) => {
  return {
    type: WEAK_PWD,
    weak
  }
}

export const errorMsg = (message, navPath) => {
  return {
    type:OPEN_ALERT,
    title: 'Error',
    message, navPath
  }
}

export const successMsg = (message, navPath) => {
  return {
    type:OPEN_ALERT,
    title: 'Success',
    message, navPath
  }
}

export const closeAlert = () => {
  return {
    type: CLOSE_ALERT
  }
}

export const openCheck = (title, message, noNav, yesNav) => {
  return {
    type: OPEN_CHECK,
    title, message, noNav, yesNav
  }
}

export const closeCheck = () => {
  return {
    type: CLOSE_CHECK
  }
}

export const GEN_OTP = 'GEN_OTP';
export const CLEAR_OTP = 'CLEAR_OTP';

export const setOTP = (secret, url, secret32) => {
  return {
    type: GEN_OTP,
    secret, url, secret32
  }
}
export const clearOTP = () => {
  return {
    type: CLEAR_OTP
  }
}