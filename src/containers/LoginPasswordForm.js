import { connect } from 'react-redux';
import PasswordForm from '../components/PasswordForm';
import { handleValueOnChange, loading, notLoading, errorMsg } from '../actions';
import { loginWithEmailPwd } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {
    state: state.forms,
    title: `Password for ${state.forms['FORM_USR']}`,
    placeHolder: 'Password',
    formName: 'FORM_PWD'
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleOnChange: (name, value) => {
      dispatch(handleValueOnChange(name, value));
    },
    
    submitOnClick: (state, history) => {
      dispatch(loading());
      loginWithEmailPwd(state['FORM_USR'],state['FORM_PWD']).catch(err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
        history.push('/loginpwd');
      })
      dispatch(notLoading());
      history.push('/loginotp');
    },
    cancelOnClick: (history) => {
      history.push('/login');
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

const LoginPasswordForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(PasswordForm)
 
export default LoginPasswordForm