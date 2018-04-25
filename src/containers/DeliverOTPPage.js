import { connect } from 'react-redux';
import DeliverOTPForm from '../components/DeliverOTPForm';
import { handleValueOnChange, loading, notLoading, errorMsg, successMsg, setOTP, clearOTP } from '../actions';
import { generateOTPKeyAndQRCode, verifyOTP, setCurrentUserOTP, updateCurrentUserOTP } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {
    state: state.forms,
    disableAutoRedirect: ownProps.disableAutoRedirect,
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
    setUpOnClick: (secret, reset) => {
      dispatch(loading());
      if(!reset) {
        setCurrentUserOTP(secret).then(() =>{
          dispatch(notLoading());
          dispatch(successMsg('2-Factor authentication credential set up. Your account is enabled', '/service'));
          dispatch(clearOTP());
        }, err => {
          dispatch(notLoading());
          dispatch(errorMsg(err.message));
        })
      } else {
        updateCurrentUserOTP(secret).then(() =>{
          dispatch(notLoading());
          dispatch(successMsg('2-Factor authentication credential set up. Your account is enabled', '/service'));
          dispatch(clearOTP());
        }, err => {
          dispatch(notLoading());
          dispatch(errorMsg(err.message));
        })
      }
    },
    generateOnClick: (state) => {
      dispatch(loading());
      let account = undefined;
      if(state && state['FORM_OTP_ACCOUNT'])
        account = state['FORM_OTP_ACCOUNT'];
      let result = generateOTPKeyAndQRCode(account);
      console.log(result);
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
    }
  }
}

const DeliverOTPPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(DeliverOTPForm)
 
export default DeliverOTPPage