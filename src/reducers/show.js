import { LOADING, NOT_LOADING, 
  WEAK_PWD, OPEN_ALERT, CLOSE_ALERT,
  OPEN_CHECK, CLOSE_CHECK } from '../actions';

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
    case OPEN_ALERT:
      return {
        ...state,
        alertTitle: action.title,
        alertMsg: action.message,
        alertNav: action.navPath
      }
    case CLOSE_ALERT:
      return {
        ...state,
        alertTitle: undefined,
        alertMsg: undefined,
        alertNav: undefined
      }
    case OPEN_CHECK:
      return {
        ...state,
        checkTitle: action.title,
        checkMsg: action.message,
        checkNoNav: action.noNav,
        checkYesNav: action.yesNav
      }
    case CLOSE_CHECK:
      return {
        ...state,
        checkTitle: undefined,
        checkMsg: undefined,
        checkNoNav: undefined,
        checkYesNav: undefined
      }
    default:
      return state;
  }
}

export default show;
