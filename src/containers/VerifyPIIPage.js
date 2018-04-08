import { connect } from 'react-redux';
import VerifyPII from '../components/VerifyPII';
import { openCheck, loading, notLoading, errorMsg, successMsg } from '../actions';
import { logout, removeAllCurrentAccountData } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {};
}

const mapDispatchToProps = dispatch => {
  return {
    handleRelog: (history) => {
      dispatch(loading());
      logout(()=>{
        dispatch(notLoading());
        history.push('/login')
      }).catch(err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message,'/login'));
      })
    },
    handleCancel: () => {
      dispatch(openCheck(
        'Are you sure to cancel the registration process?',
        'This action is not revertable. All account info would be deleted immediately.',
        undefined, '/login'
      ));
    },
    handleRemove: () => {
      dispatch(loading());
      removeAllCurrentAccountData()
      .then(()=> {
        dispatch(notLoading());
        dispatch(successMsg('Your account and all personal data are removed', '/login'));
      })
      .catch(err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      })
    },
    dispatchLoading: () => {
      dispatch(loading());
    },
    dispatchNotLoading: () => {
      dispatch(notLoading());
    }
  }
}

const VerifyPIIPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(VerifyPII)
 
export default VerifyPIIPage