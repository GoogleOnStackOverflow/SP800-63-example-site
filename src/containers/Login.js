import { connect } from 'react-redux';
import { LoginFormWithRouter } from '../components/LoginForm';
import { handleValueOnChange } from '../actions';

const mapStateToProps = (state, ownProps) => {
  return {
    state: state.forms
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleOnChange: (name, value) => {
      dispatch(handleValueOnChange(name, value));
    }
  }
}

const Login = connect(
  mapStateToProps,
  mapDispatchToProps
)(LoginFormWithRouter)
 
export default Login