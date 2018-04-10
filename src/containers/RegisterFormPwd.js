import { connect } from 'react-redux';
import RegisterPwdForm from '../components/RegisterPwdForm';
import { handleValueOnChange, loading, notLoading, errorMsg, successMsg } from '../actions';
import { sendEmailVerification, registerWithEmail } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {
    state: state.forms,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleOnChange: (name, value) => {
      dispatch(handleValueOnChange(name, value));
    },
    submitOnClick: (state, history) => {
      dispatch(loading());
      registerWithEmail(state['FORM_USR'], state['FORM_REG_PWD'])
      .then(usr => {
        dispatch(handleValueOnChange('FORM_REG_PWD_CHECK', ''));
        dispatch(handleValueOnChange('FORM_REG_PWD', ''));
        sendEmailVerification(() => {
          dispatch(notLoading());
          dispatch(successMsg('An verification mail has been sent to your mail address.', '/verifymail'))
        }).catch(err => {
          dispatch(notLoading());
          dispatch(errorMsg(err.message, '/login'));
        })
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      })
      .catch(err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      });
    },
    cancelOnClick: (history) => {
      dispatch(handleValueOnChange('FORM_REG_PWD_CHECK', ''));
      dispatch(handleValueOnChange('FORM_REG_PWD', ''));
      history.push('/login');
    }
  }
}

const RegisterForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(RegisterPwdForm)
 
export default RegisterForm