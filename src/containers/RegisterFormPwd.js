import { connect } from 'react-redux';
import RegisterPwdForm from '../components/RegisterPwdForm';
import { handleValueOnChange, loading, notLoading, errorMsg } from '../actions';
import { registerWithEmail , logout } from '../firebaseActions'

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
      registerWithEmail(state['FORM_USR'], state['FORM_REG_PWD']).catch(err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
        history.push('/registerpwd');
      });
      
      dispatch(notLoading());
      dispatch(handleValueOnChange('FORM_REG_PWD_CHECK', ''));
      dispatch(handleValueOnChange('FORM_REG_PWD', ''));
      logout(()=>{history.push('/login');/*TODO dispatch(successMsg('An verification mail has been sent to your mail address.'))*/}).catch(err => {
        dispatch(errorMsg(err.message));
        history.push('/login');  
      })
      
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