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
      loginWithEmailPwd(state['FORM_USR'],state['FORM_PWD'])
      .then(() => {
        dispatch(notLoading());
        dispatch(handleValueOnChange('FORM_PWD', ''));
        history.push('/verifymail');
      }, err => {
        dispatch(handleValueOnChange('FORM_PWD', ''));
        dispatch(notLoading());
        if(err.code === 'auth/wrong-password')
          dispatch(errorMsg(err.message, '/loginpwd'));
        else
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