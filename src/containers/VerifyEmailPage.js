import { connect } from 'react-redux';
import VerifyEmail from '../components/VerifyEmail';
import { openCheck, loading, notLoading, errorMsg, successMsg, clearAllForm } from '../actions';
import { sendEmailVerification, logout, removeAllCurrentAccountData } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {};
}

const mapDispatchToProps = dispatch => {
  return {
    handleResend: () => {
      dispatch(loading());
      sendEmailVerification().then(() => {
        logout(()=>{
          dispatch(notLoading());
          dispatch(successMsg('An verification mail has been sent to your mail address.', '/login'))
        }).catch(err => {
          dispatch(notLoading());
          dispatch(errorMsg(err.message, '/login'));
        })
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message, '/login'));
      }).catch(err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message, '/login'));
      })
    },
    handleRelog: () => {
      dispatch(loading());
      logout(()=>{
        dispatch(clearAllForm());
        dispatch(notLoading());
        dispatch(successMsg('Successfully signed out', '/login'));
      }).catch(err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message,'/login')); 
      })
    },
    handleCancel: () => {
      dispatch(openCheck(
        'Are you sure to cancel the registration process?',
        'This action is not revertible. All account info would be deleted immediately.'
      ));
    },
    handleRemove: () => {
      dispatch(loading());
      removeAllCurrentAccountData().then(()=> {
        dispatch(notLoading());
        dispatch(successMsg('Your account and all personal data have been removed', '/login'));
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      }).catch(err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      })
    }
  }
}

const VerifyEmailPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(VerifyEmail)
 
export default VerifyEmailPage