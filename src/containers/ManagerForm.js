import { connect } from 'react-redux';
import ManagerForm from '../components/ManagerForm';
import { loading, notLoading, errorMsg, handleValueOnChange } from '../actions';
import { setUserPiiVerified, getAllNotVerifiedUsers } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {
  return {
    userPiisObj: state.forms['ADMIN_PII_DATA']?  state.forms['ADMIN_PII_DATA'] : {}
  };
}

const mapDispatchToProps = dispatch => {
  return {
    handleOnChange: (name, value) => {
      dispatch(handleValueOnChange(name, value));
    },
    dispatchLoading: () => {
      dispatch(loading());
    },
    dispatchNotLoading: () => {
      dispatch(notLoading());
    },
    dispatchErrMsg: (msg, nav) => {
      dispatch(errorMsg(msg, nav));
    },
    handleVerifyOnClick: (mailid, state) => {
      dispatch(loading());
      setUserPiiVerified(mailid).then(() => {
        getAllNotVerifiedUsers().then(result => {
          dispatch(notLoading());
          dispatch(handleValueOnChange('ADMIN_PII_DATA', result));
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
)(ManagerForm)