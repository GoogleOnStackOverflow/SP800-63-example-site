import { connect } from 'react-redux';
import VerifyPII from '../components/VerifyPII';
import { openCheck, loading, notLoading, errorMsg, successMsg ,handleValueOnChange } from '../actions';
import { logout, removeAllCurrentAccountData, getCurrentUserPhone, sendPhoneVerificationCode, verifySMSCode } from '../firebaseActions'

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
    handleRelog: (history) => {
      dispatch(loading());
      logout(()=>{
        dispatch(notLoading());
        history.push('/login')
      }).catch(err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message,'/login'));
      })
    },
    handleCancel: () => {
      dispatch(openCheck(
        'Are you sure to cancel the registration process?',
        'This action is not revertable. All account info would be deleted immediately.',
        undefined, '/login'
      ));
    },
    handleRemove: () => {
      dispatch(loading());
      removeAllCurrentAccountData()
      .then(()=> {
        dispatch(notLoading());
        dispatch(successMsg('Your account and all personal data are removed', '/login'));
      })
      .catch(err => {
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
      console.log(`Verifying code ${state['FORM_PII_REG_PHONE_CODE']}`)
      console.log(window.confirmationResult);
      verifySMSCode(state['FORM_PII_REG_PHONE_CODE'], window.confirmationResult).then(() => {
        dispatch(notLoading());
        dispatch(successMsg('Your phone number is verified','/piires'));
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

const VerifyPIIPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(VerifyPII)
 
export default VerifyPIIPage