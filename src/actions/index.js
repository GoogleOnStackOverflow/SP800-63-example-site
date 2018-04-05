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
export const OPEN_ERR_ALERT = 'OPEN_ERR_ALERT';
export const CLOSE_ERR_ALERT = 'CLOSE_ERR_ALERT';

export const weak = (weak) => {
  return {
    type: WEAK_PWD,
    weak
  }
}

export const errorMsg = (message) => {
  return {
    type:OPEN_ERR_ALERT,
    message
  }
}

export const closeMsgModal = () => {
  return {
    type: CLOSE_ERR_ALERT
  }
}