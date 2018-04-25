import { connect } from 'react-redux';
import UpdatePhoneNum from '../components/UpdatePhoneNum';
import { loading, notLoading, errorMsg, successMsg ,handleValueOnChange } from '../actions';
import { thePhoneNumberUsed, sendPhoneVerificationCode, updateCurrentUserPhone } from '../firebaseActions'

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
    handleCancel: (history) => {
      dispatch(handleValueOnChange('FORM_PII_REG_PHONE', ''));
      dispatch(handleValueOnChange('FORM_PII_REG_PHONE_CODE', ''));
      history.push('/service');
    },
    dispatchLoading: () => {
      dispatch(loading());
    },
    dispatchNotLoading: () => {
      dispatch(notLoading());
    },
    handleSendSMS: (callback, state) => {
      dispatch(loading());
      let phoneNum = state['FORM_PII_REG_PHONE']
      thePhoneNumberUsed(phoneNum).then(used => {
        if(!used) {
          sendPhoneVerificationCode(phoneNum).then(confirmationResult => {
            dispatch(notLoading());
            dispatch(successMsg('A confirmation code has been sent to your phone via SMS'));
            window.confirmationResult = confirmationResult;
            if(callback)
              callback();
          }, err => {
            dispatch(notLoading());
            dispatch(errorMsg(err.message));
          })
        } else {
          dispatch(notLoading());
          dispatch(errorMsg('The phone number is for another account. Please choose another one.'))
        }
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      })
    },
    handleCodeVerification: (state) => {
      dispatch(loading());
      updateCurrentUserPhone(state['FORM_PII_REG_PHONE'] ,state['FORM_PII_REG_PHONE_CODE'], window.confirmationResult).then(() => {
        dispatch(notLoading());
        dispatch(handleValueOnChange('FORM_PII_REG_PHONE', ''));
        dispatch(handleValueOnChange('FORM_PII_REG_PHONE_CODE', ''));
        dispatch(successMsg('Your phone number is verified and updated','/service'));
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      }).catch(err => {
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
)(UpdatePhoneNum)