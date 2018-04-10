import { connect } from 'react-redux';
import RegisterPIIForm from '../components/RegisterPIIForm';
import { handleValueOnChange, loading, notLoading, errorMsg, successMsg, openCheck } from '../actions';
import { removeAllCurrentAccountData, editCurrentUserPII } from '../firebaseActions'

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
    
    submitOnClick: (state, userInfoGenerator, history) => {
      dispatch(loading());
      editCurrentUserPII(userInfoGenerator(state)).then(()=> {
        dispatch(notLoading());
        clearAllPIIFormData(state, dispatch);
        dispatch(successMsg('Personal data updated', '/verifypii'))
      }, err => {
        dispatch(errorMsg(err.message));
      })
    },
    cancelOnClick: () => {
      dispatch(openCheck(
        'Are you sure to cancel the registration process?',
        'This action is not revertable. All account info would be deleted immediately.',
        undefined, '/login'
      ));
    },
    handleRemove: (state) => {
      dispatch(loading());
      removeAllCurrentAccountData()
      .then(()=> {
        dispatch(notLoading());
        clearAllPIIFormData(state, dispatch);
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

const RegisterPIIPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(RegisterPIIForm)
 
export default RegisterPIIPage