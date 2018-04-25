import { connect } from 'react-redux';
import ResetVerifyPhone from '../components/ResetVerifyPhone';
import { loading, notLoading, errorMsg, successMsg ,handleValueOnChange } from '../actions';
import { sendPhoneVerificationCode, getCurrentUserPhone, getCurrentUserEmail, stopRecoverProcess, loginWithPhoneCode } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {
    state: state.forms
  };
}

const mapDispatchToProps = dispatch => {
  return {
    handleOnChange: (name, value) => {
      dispatch(handleValueOnChange(name, value));
    },
    handleCancel: () => {
      dispatch(loading());
      stopRecoverProcess(getCurrentUserEmail()).then(() => {
        dispatch(notLoading());
        dispatch(successMsg('Recovering process is stopped. If you want to recover your account, please re-login and verify your personal information again', '/login'));
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      })
    },
    dispatchLoading: () => {
      dispatch(loading());
    },
    dispatchNotLoading: () => {
      dispatch(notLoading());
    },
    handleSendSMS: (callback) => {
      dispatch(loading());
      getCurrentUserPhone().then(phoneNum => {
        sendPhoneVerificationCode(phoneNum).then(confirmationResult => {
          dispatch(notLoading());
          dispatch(successMsg('A confirmation code has been sent to your phone via SMS'));
          window.confirmationResult = confirmationResult;
          callback();
        }, err => {
          dispatch(notLoading());
          dispatch(errorMsg(err.message));
        })
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      })
    },
    handleCodeVerification: (state) => {
      dispatch(loading());
      loginWithPhoneCode(state['FORM_PII_REG_PHONE_CODE'], window.confirmationResult).then(() => {
        dispatch(notLoading());
        dispatch(successMsg('Your identity is verified','/resetcredentials'));
        dispatch(handleValueOnChange('FORM_PII_REG_PHONE_CODE', ''));
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      })
      
    },
    dispatchErrMsg: (msg, nav) => {
      dispatch(errorMsg(msg, nav));
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ResetVerifyPhone)