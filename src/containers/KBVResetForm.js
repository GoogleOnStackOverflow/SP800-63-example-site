import { connect } from 'react-redux';
import KBVResetForm from '../components/KBVResetForm';
import { handleValueOnChange, loading, notLoading, errorMsg, successMsg } from '../actions';
import { startRecoverProcess, checkAndSendResetMail } from '../firebaseActions'

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
    dispatchErrMsg: (msg, nav) => {
      dispatch(errorMsg(msg, nav));
    },
    dispatchLoading: () => {
      dispatch(loading());
    },
    dispatchNotLoading: () => {
      dispatch(notLoading());
    },
    handleCancel: (history) => {
      dispatch(loading());
      dispatch(handleValueOnChange('FORM_RESET_ID', ''));
      dispatch(handleValueOnChange('FORM_RESET_BIRTHDAY', ''));
      dispatch(notLoading());
      history.push('/login');
    },
    handleSubmit: (state) => {
      dispatch(loading());
      startRecoverProcess(
        state['FORM_USR'], state['FORM_RESET_ID'], 
        state['FORM_RESET_BIRTHDAY']).then(() => {
        checkAndSendResetMail(state['FORM_USR']).then(() => {
          dispatch(notLoading());
          dispatch(successMsg('A reset password has been sent to the mail box. Use the link in the mail to continue the recovering process', '/login'));
        }, err => {
          dispatch(notLoading());
          dispatch(errorMsg(err.message));
        })
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      })
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(KBVResetForm)