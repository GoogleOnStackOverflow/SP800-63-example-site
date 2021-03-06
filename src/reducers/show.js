import { SHOW_COVERING, CLOSE_COVERING, 
  OPEN_ALERT, CLOSE_ALERT,
  OPEN_CHECK, CLOSE_CHECK,
  GEN_OTP, CLEAR_OTP,
  FIRE_REAUTH, CANCEL_REAUTH} from '../actions';

const show = (state = {}, action) => {
  switch (action.type) {
    case SHOW_COVERING:
      return {
        ...state,
        covering: action.covering
      }
    case CLOSE_COVERING:
      return {
        ...state,
        covering: undefined
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
    case GEN_OTP: 
      return {
        ...state,
        otpSecret: action.secret,
        otpSecret32: action.secret32,
        otpUrl: action.url
      }
    case CLEAR_OTP:
      return {
        ...state,
        otpSecret: undefined,
        otpSecret32: undefined,
        otpUrl: undefined
      }
    case FIRE_REAUTH:
      return {
        ...state,
        reauthRoute: action.reauthRoute
      }
    case CANCEL_REAUTH:
      return {
        ...state,
        reauthRoute: undefined
      }
    default:
      return state;
  }
}

export default show;
