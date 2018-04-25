import { connect } from 'react-redux';
import ResetEmail from '../components/ResetEmail';
import { loading, notLoading, errorMsg, successMsg } from '../actions';
import { stopRecoverProcess, checkAndSendResetMail } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {
    emailTarget: state.forms['FORM_USR']
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleCancel: (mail) => {
      dispatch(loading());
      stopRecoverProcess(mail).then(() => {
        dispatch(notLoading());
        dispatch(successMsg('Recovering process is stopped. If you want to recover your account, please re-login and verify your personal information again', '/login'));
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      })
    },
    handleResend : (mail) => {
      dispatch(loading());
      checkAndSendResetMail(mail).then(() => {
        dispatch(notLoading());
        dispatch(successMsg('A reset password has been sent to the mail box. Use the link in the mail to continue the recovering process', '/login'));
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      })
    },
    dispatchErrMsg: (msg, nav) => {
      dispatch(errorMsg(msg, nav));
    },
    dispatchLoading: () => {
      dispatch(loading());
    },
    dispatchNotLoading: () => {
      dispatch(notLoading());
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ResetEmail)