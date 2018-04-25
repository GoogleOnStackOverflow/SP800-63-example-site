import { connect } from 'react-redux';
import IdleModal from '../components/IdleModal';
import { resetIdleTimer, loading, notLoading, errorMsg, successMsg, clearAllForm } from '../actions';
import { logout } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {
    idle: state.idle
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleLogout: (history) => {
      dispatch(loading());
      logout(() => {
        dispatch(notLoading());
        dispatch(clearAllForm());
        history.push('/login');
        dispatch(successMsg('You are successfully signed out.'));
      }).catch(err => {
        dispatch(notLoading());
        history.push('/login');
        dispatch(errorMsg(err.message));
      })
    },
    handleKeepOn: () => {
      dispatch(resetIdleTimer());
    },
    clearAllValue: () => {
      dispatch(clearAllForm());
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(IdleModal)