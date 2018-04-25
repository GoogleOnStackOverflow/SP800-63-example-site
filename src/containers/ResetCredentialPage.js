import { connect } from 'react-redux';
import ResetAccountCredential from '../components/ResetAccountCredential';
import { handleValueOnChange, loading, notLoading, errorMsg, successMsg, setOTP, clearOTP } from '../actions';
import { generateOTPKeyAndQRCode, verifyOTP, 
  setCurrentUserOTP, stopRecoverProcess,
  getCurrentUserEmail, updateCurrentUserPassword} from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {
    state: state.forms,
    imageUrl: state.show.otpUrl,
    secret: state.show.otpSecret,
    secret32: state.show.otpSecret32
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleOnChange: (name, value) => {
      dispatch(handleValueOnChange(name, value));
    },
    dispatchLoading: () => {
      dispatch(loading());
    },
    dispatchNotLoading: () => {
      dispatch(notLoading());
    },
    generateOnClick: (state) => {
      dispatch(loading());
      let account = undefined;
      if(state && state['FORM_OTP_ACCOUNT'])
        account = state['FORM_OTP_ACCOUNT'];
      let result = generateOTPKeyAndQRCode(account);
      dispatch(setOTP(result[0], result[1], result[2]));
      dispatch(notLoading());
    },
    verifyOnClick: (state, secret, successCallBack) => {
      dispatch(loading());
      if(!state || !state['FORM_OTP'] || !secret) {
        dispatch(notLoading());
        dispatch(errorMsg('Verification Failed. Either the OTP or the key is not properly set up'));
      } else if(verifyOTP(state['FORM_OTP'], secret)){
        dispatch(notLoading());
        dispatch(successMsg('OTP verified. You can set the OTP up now and enable your account'));
        successCallBack();
      } else {
        dispatch(notLoading());
        dispatch(errorMsg('Verification Failed. Invalid OTP'));
      }
    },
    dispatchErrMsg: (msg, nav) => {
      dispatch(errorMsg(msg, nav));
    },
    handleCancel: () => {
      dispatch(loading());
      dispatch(handleValueOnChange('FORM_REG_PWD_CHECK', ''));
      dispatch(handleValueOnChange('FORM_REG_PWD', ''));
      dispatch(handleValueOnChange('FORM_OTP_ACCOUNT', ''));
      dispatch(clearOTP());
      stopRecoverProcess(getCurrentUserEmail()).then(() => {
        dispatch(notLoading());
        dispatch(successMsg('Recovering process is stopped. If you want to recover your account, please re-login and verify your personal information again', '/login'));
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      })
    },
    setUpOnClick: (secret, state) => {
      dispatch(loading());
      if(!state['FORM_REG_PWD'] || state['FORM_REG_PWD_CHECK'] !== state['FORM_REG_PWD']) {
        dispatch(notLoading());
        dispatch(errorMsg('Data lost. Please choose your new password and pass the OTP verification first'));
      } else {
        Promise.all([
          setCurrentUserOTP(secret),
          updateCurrentUserPassword(state['FORM_REG_PWD'])
        ]).then(() => {
          stopRecoverProcess(getCurrentUserEmail()).then(() => {
            dispatch(notLoading());
            dispatch(handleValueOnChange('FORM_REG_PWD_CHECK', ''));
            dispatch(handleValueOnChange('FORM_REG_PWD', ''));
            dispatch(handleValueOnChange('FORM_OTP_ACCOUNT', ''));
            dispatch(clearOTP());
            dispatch(successMsg('Your account is reset. Please use the new password and OTP to login next time.', '/login'));
          }, err => {
            dispatch(notLoading());
            dispatch(errorMsg(err.message));
          })
        }, err => {
          dispatch(notLoading());
          dispatch(errorMsg(err.message));
        }).catch(err => {
          dispatch(notLoading());
          dispatch(errorMsg(err.message));
        }) 
      }
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ResetAccountCredential)