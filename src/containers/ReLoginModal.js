import { connect } from 'react-redux';
import ReLoginForm from '../components/ReLoginForm';
import { handleValueOnChange, loading, notLoading, errorMsg, successMsg, cancelReauth } from '../actions';
import { reauthCurrentUser } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {
    state: state.forms,
    successRoute: state.show.reauthRoute
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleOnChange: (name, value) => {
      dispatch(handleValueOnChange(name, value));
    },
    
    handleReAuth: (state, history, successRoute) => {
      dispatch(loading());
      reauthCurrentUser(state['FORM_PWD'], state['FORM_OTP']).then(() => {
        dispatch(notLoading());
        dispatch(handleValueOnChange('FORM_PWD', ''));
        dispatch(handleValueOnChange('FORM_OTP', ''));
        dispatch(cancelReauth());
        dispatch(successMsg('Reauthentication success.', successRoute));
      }, err => {
        dispatch(notLoading());
        dispatch(cancelReauth());
        dispatch(errorMsg(err.message));
      })
    },
    handleCancel: () => {
      dispatch(handleValueOnChange('FORM_PWD', ''));
      dispatch(handleValueOnChange('FORM_OTP', ''));
      dispatch(cancelReauth());
    }
  }
}

const ReLoginModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(ReLoginForm)
 
export default ReLoginModal