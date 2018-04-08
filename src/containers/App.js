import { connect } from 'react-redux';
import AppNavBar from '../components/AppNavBar';
import { loading, notLoading, errorMsg, successMsg } from '../actions';
import { hasCurrentUser, logout } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {
    isLogin: hasCurrentUser()
  };
}

const mapDispatchToProps = dispatch => {
  return {
    handleLogOnClick: (history) => {
      if(hasCurrentUser()){
        dispatch(loading());
        logout(()=> {
          dispatch(notLoading());
          dispatch(successMsg('Successfully signed out', '/login'))
        }).catch(err => {
          dispatch(notLoading());
          dispatch(errorMsg(err.message))
        })
      } else {
        history.push('/login');
      }
    }
  }
}

const App = connect(
  mapStateToProps,
  mapDispatchToProps
)(AppNavBar)
 
export default App