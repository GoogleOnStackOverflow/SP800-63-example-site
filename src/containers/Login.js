import { connect } from 'react-redux';
import { LoginFormWithRouter } from '../components/LoginForm';
import { handleValueOnChange, loading, notLoading, errorMsg } from '../actions';
import { checkAccountExist } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {
    state: state.forms
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleOnChange: (name, value) => {
      dispatch(handleValueOnChange(name, value));
    },
    nextOnClick: (email, history) => {
      dispatch(loading());
      checkAccountExist(email).then(result => {
        dispatch(notLoading());
        if(result)
          history.push('/loginpwd');
        else 
          history.push('/registerpwd');
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      })
    }
  }
}

const Login = connect(
  mapStateToProps,
  mapDispatchToProps
)(LoginFormWithRouter)
 
export default Login