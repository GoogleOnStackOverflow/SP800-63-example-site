export const HANDLE_VALUE_ONCHANGE = 'HANDLE_VALUE_ONCHANGE';
export const CLEAR_ALL_VALUE = 'CLEAR_ALL_VALUE';

export const handleValueOnChange = (formName, value) => {
  return {
    type: HANDLE_VALUE_ONCHANGE,
    formName, value
  }
}

export const clearAllForm = () => {
  return {
    type: CLEAR_ALL_VALUE
  }
}

export const SHOW_COVERING = 'SHOW_COVERING';
export const CLOSE_COVERING = 'CLOSE_COVERING';

export const showCovering = (title, content) => {
  return {
    type: SHOW_COVERING,
    covering: {title, content}
  }
}

export const closeCovering = () => {
  return {
    type: CLOSE_COVERING
  }
}

export const loading = () => {
  return showCovering('Loading', 'Please wait...');
}

export const notLoading = () => {
  return closeCovering();
}

export const OPEN_ALERT = 'OPEN_ALERT';
export const CLOSE_ALERT = 'CLOSE_ALERT';
export const OPEN_CHECK = 'OPEN_CHECK'
export const CLOSE_CHECK = 'CLOSE_CHECK';

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

export const FIRE_REAUTH = 'FIRE_REAUTH';
export const CANCEL_REAUTH = 'CANCEL_REAUTH';

export const reauthUser = (reauthRoute) => {
  return {
    type: FIRE_REAUTH,
    reauthRoute
  }
}

export const cancelReauth = () => {
  return {
    type: CANCEL_REAUTH
  }
}

export const resetIdleTimer = () => {
  return {
    type: 'RESET_IDLE'
  }
}