import { connect } from 'react-redux';
import PasswordForm from '../components/PasswordForm';
import { handleValueOnChange, loading, notLoading, errorMsg } from '../actions';
import { logout } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {
    state: state.forms,
    title: `OTP for ${state.forms['FORM_USR']}`,
    placeHolder: 'OTP',
    formName: 'FORM_OTP'
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleOnChange: (name, value) => {
      dispatch(handleValueOnChange(name, value));
    },
    
    submitOnClick: (state, history) => {
      dispatch(loading());
      // TODO verify the OTP
      dispatch(notLoading());
      console.log('pass');
      history.push('/loginotp');
    },
    cancelOnClick: (history) => {
      logout(()=>{history.push('/login')}).catch(err => {
        dispatch(errorMsg(err.message));
        history.push('/login');  
      })
    }
    /*
    registerOnClick: (usrname, pwd) => {
      dispatch(loading());
      registerWithEmail(usrname, pwd).catch(err => {
        if(err.code === 'auth/weak-password') {
          dispatch(notLoading());
          dispatch(weak(true));
        } else {
          dispatch(notLoading());
          dispatch(errorMsg(err.message));
        }
      });
      dispatch(notLoading());
    }*/
  }
}

const LoginOTPForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(PasswordForm)
 
export default LoginOTPForm