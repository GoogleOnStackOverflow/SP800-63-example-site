import { LOADING, NOT_LOADING, WEAK_PWD, OPEN_ERR_ALERT, CLOSE_ERR_ALERT } from '../actions';

const show = (state = {}, action) => {
  switch (action.type) {
    case LOADING:
      return {
        ...state,
        loading: true
      }
    case NOT_LOADING:
      return {
        ...state,
        loading: false
      }
    case WEAK_PWD:
      return {
        ...state,
        weak: action.weak
      }
    case OPEN_ERR_ALERT:
      return {
        ...state,
        errMsg: action.message
      }
    case CLOSE_ERR_ALERT:
      return {
        ...state,
        errMsg: undefined
      }
    default:
      return state;
  }
}

export default show;
