import { connect } from 'react-redux';
import RegisterPIIForm from '../components/RegisterPIIForm';
import { userDataFormNames } from '../components/RegisterPIIForm';
import { handleValueOnChange, loading, notLoading, errorMsg, successMsg, openCheck } from '../actions';
import { removeAllCurrentAccountData, setCurrentUserPII, thePhoneNumberUsed } from '../firebaseActions'

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
      thePhoneNumberUsed(state[userDataFormNames.Phone]).then((used) => {
        if(used){
          dispatch(notLoading());
          dispatch(errorMsg('The phone number is used for another account'));
        } else {
          setCurrentUserPII(userInfoGenerator(state)).then(()=> {
            dispatch(notLoading());
            clearAllPIIFormData(state, dispatch);
            dispatch(successMsg('Personal data updated', '/verifypii'))
          }, err => {
            dispatch(notLoading());
            dispatch(errorMsg(err.message));
          })
        }
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      })
    },
    cancelOnClick: () => {
      dispatch(openCheck(
        'Are you sure to cancel the registration process?',
        'This action is not revertible. All account info would be deleted immediately.'
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

const RegisterPIIPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(RegisterPIIForm)
 
export default RegisterPIIPage