import { connect } from 'react-redux';
import VerifyEmail from '../components/VerifyEmail';
import { openCheck, loading, notLoading, errorMsg, successMsg, clearAllForm } from '../actions';
import { sendEmailVerification, logout, removeAccount } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {};
}

const mapDispatchToProps = dispatch => {
  return {
    handleResend: () => {
      dispatch(loading());
      sendEmailVerification(() => {
        logout(()=>{
          dispatch(notLoading());
          dispatch(successMsg('An verification mail has been sent to your mail address.', '/login'))
        }).catch(err => {
          dispatch(notLoading());
          dispatch(errorMsg(err.message, '/login'));
        })}
      ).catch(err => {
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
        'This action is not revertable. All account info would be deleted immediately.',
        undefined, '/login'
      ));
    },
    handleRemove: () => {
      dispatch(loading());
      removeAccount()
      .then(()=> {
        dispatch(notLoading());
        dispatch(successMsg('Your account and all personal data have been removed', '/login'));
      })
      .catch(err => {
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