import { connect } from 'react-redux';
import UpdatePassword from '../components/UpdatePassword';
import { handleValueOnChange, loading, notLoading, errorMsg, successMsg } from '../actions';
import { updateCurrentUserPassword } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {
    state: state.forms,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleOnChange: (name, value) => {
      dispatch(handleValueOnChange(name, value));
    },
    submitOnClick: (state, history) => {
      dispatch(loading());
      updateCurrentUserPassword(state['FORM_REG_PWD']).then(() => {
        dispatch(notLoading());
        dispatch(handleValueOnChange('FORM_REG_PWD', ''));
        dispatch(handleValueOnChange('FORM_REG_PWD_CHECK', ''));
        dispatch(successMsg('Password updated. Please use the new password when logging in next time', '/service'));
      }, err => {
        if(err.code === 'auth/requires-recent-login') {
          dispatch(notLoading());
          dispatch(handleValueOnChange('FORM_REG_PWD', ''));
          dispatch(handleValueOnChange('FORM_REG_PWD_CHECK', ''));
          dispatch(errorMsg('Authentication timeout. Please re-auth again.', '/service'));
        } else {
          dispatch(notLoading());
          dispatch(errorMsg(err.message));
        }
      }).catch(err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      })
    },
    cancelOnClick: (history) => {
      dispatch(handleValueOnChange('FORM_REG_PWD', ''));
      dispatch(handleValueOnChange('FORM_REG_PWD_CHECK', ''));
      history.push('/service');
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
)(UpdatePassword)
 
