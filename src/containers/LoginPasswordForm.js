import { connect } from 'react-redux';
import PasswordForm from '../components/PasswordForm';
import { handleValueOnChange, loading, notLoading, errorMsg } from '../actions';
import { loginWithEmailPwd, currentUserOTPDelivered } from '../firebaseActions'

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
      loginWithEmailPwd(state['FORM_USR'],state['FORM_PWD'])
      .then(() => {
        currentUserOTPDelivered().then(result => {
          dispatch(notLoading());
          dispatch(handleValueOnChange('FORM_PWD', ''));
          if(result)
            history.push('/loginotp');
          else
            history.push('/verifymail');
        }, err => {
          dispatch(notLoading());
          dispatch(errorMsg(err.message));
        })
      }, err => {
        dispatch(handleValueOnChange('FORM_PWD', ''));
        dispatch(notLoading());
        if(err.code === 'auth/wrong-password') {
          dispatch(errorMsg(err.message, '/loginpwd'));
        } else if(err.message === 'Permission denied. Wrong password trial limit reached') {
          dispatch(errorMsg(`${err.message}. Your account is temporary disabled, you would have to recover your account`, '/resetaccount'))
        } else if(err.message === 'UnderRecover') {
          dispatch(errorMsg('Your account is under recover, you should reset your account first', '/resetaccount'));
        } else
          dispatch(errorMsg(err.message, '/login'));
      })
    },
    cancelOnClick: (history) => {
      dispatch(handleValueOnChange('FORM_PWD', ''));
      history.push('/login');
    }
  }
}

const LoginPasswordForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(PasswordForm)
 
export default LoginPasswordForm