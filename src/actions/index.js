export const PWD_LOGIN = 'PWD_LOGIN';
export const LOADING = 'LOADING';
export const NOT_LOADING = 'NOT_LOADING';

export const HANDLE_VALUE_ONCHANGE = 'HANDLE_VALUE_ONCHANGE';

export const handleValueOnChange = (formName, value) => {
  return {
    type: HANDLE_VALUE_ONCHANGE,
    formName, value
  }
}

export const pwdLogin = (usrname, pwd) => {
  return {
    type: PWD_LOGIN,
    usrname, pwd
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