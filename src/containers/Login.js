import { connect } from 'react-redux';
import LoginFrom from '../components/LoginForm';
import { handleValueOnChange, loading, notLoading } from '../actions';
import { API_SERVER } from '../config'

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
      fetch(`${API_SERVER}/pwdlogin?usr=${usrname}&pwd=${pwd}`).then(res => {
        return res.json();
      }).then(data => {
        console.log(data);
        dispatch(notLoading());
      }).catch(error => console.error(error))
    }
  }
}

const Login = connect(
  mapStateToProps,
  mapDispatchToProps
)(LoginFrom)
 
export default Login