import { connect } from 'react-redux';
import PasswordForm from '../components/PasswordForm';
import { handleValueOnChange, loading, notLoading, errorMsg } from '../actions';
import { loginWithOTP, logout, loginGetChallenge } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {
    state: state.forms,
    title: `OTP for ${state.forms['FORM_USR']}`,
    placeHolder: 'OTP',
    formName: 'FORM_OTP',
    challenge: state.forms['FORM_LOGIN_CHALLENGE']
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleOnChange: (name, value) => {
      dispatch(handleValueOnChange(name, value));
    },
    
    submitOnClick: (state, history) => {
      dispatch(loading());
      loginWithOTP(state['FORM_OTP']).then(() => {
        dispatch(handleValueOnChange('FORM_OTP', ''));
        loginGetChallenge().then(challenge => {
          dispatch(notLoading());
          if(challenge)
            dispatch(handleValueOnChange('FORM_LOGIN_CHALLENGE', challenge))
          else
            history.push('/service');    
        }, err => {
          dispatch(notLoading());
          dispatch(errorMsg(err.message));
        })
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      });
    },
    cancelOnClick: (history) => {
      logout(()=>{history.push('/login')})
      .catch(err => {
        dispatch(errorMsg(err.message));
        history.push('/login');  
      })
    }
  }
}

const LoginOTPForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(PasswordForm)
 
export default LoginOTPForm