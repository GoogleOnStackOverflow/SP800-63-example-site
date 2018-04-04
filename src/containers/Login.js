import { connect } from 'react-redux';
import LoginFrom from '../components/LoginForm';
import { handleValueOnChange, loading, notLoading , pwdLogin } from '../actions';

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
    submitOnClick: (usrname, pwd) => {
      dispatch(loading());
      dispatch(pwdLogin(usrname, pwd));
      dispatch(notLoading());
    }
  }
}

const Login = connect(
  mapStateToProps,
  mapDispatchToProps
)(LoginFrom)
 
export default Login