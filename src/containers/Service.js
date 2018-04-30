import { connect } from 'react-redux';
import Service from '../components/Service';
import { handleValueOnChange, loading, notLoading, errorMsg, successMsg, openCheck, reauthUser } from '../actions';
import { removeAllCurrentAccountData } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {
    state: state.forms,
    autoRedirect: ownProps.autoRedirect
  }
}

const clearAllPIIFormData = (state, dispatch) => {
  Object.keys(state).forEach(stateKey => {
    if(stateKey.includes('FORM_PII_REG_'))
      dispatch(handleValueOnChange(stateKey, ''));
  })
}

const mapDispatchToProps = dispatch => {
  return {
    handleOnChange: (name, value) => {
      dispatch(handleValueOnChange(name, value));
    },
    removeAccountOnClick: () => {
      dispatch(reauthUser());
      dispatch(openCheck(
        'Are you sure to remove your account?',
        'This action is not revertable. All account info would be deleted immediately.'
      ));
    },
    handleRemove: (state) => {
      dispatch(loading());
      removeAllCurrentAccountData().then(()=> {
        dispatch(notLoading());
        clearAllPIIFormData(state, dispatch);
        dispatch(successMsg('Your account and all personal data are removed', '/login'));
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      }).catch(err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      })
    },
    changePwdOnClick: () => {
      dispatch(reauthUser('/changepwd'));
    },
    changeOTPOnClick: () => {
      dispatch(reauthUser('/changeotp'));
    },
    changePhoneNumOnClick: () => {
      dispatch(reauthUser('/changephone'));
    },
    dispatchLoading: () => {
      dispatch(loading());
    },
    dispatchNotLoading: () => {
      dispatch(notLoading());
    },
    dispatchErrMsg: (msg, nav) => {
      dispatch(errorMsg(msg, nav));
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Service)