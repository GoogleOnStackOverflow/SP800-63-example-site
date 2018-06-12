import { connect } from 'react-redux';
import EvidenceForm from '../components/EvidenceForm';
import { loading, notLoading, errorMsg, successMsg, openCheck } from '../actions';
import { uploadUserEvidences, removeAllCurrentAccountData } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {}

const mapDispatchToProps = dispatch => {
  return {
    handleSubmit: (images) => {
      dispatch(loading());
      uploadUserEvidences(images).then(()=> {
        dispatch(notLoading());
        dispatch(successMsg('Evidences are updated successfully','/piires'));
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      }).catch(err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      })
    },
    handleRemove: () => {
      dispatch(loading());
      removeAllCurrentAccountData().then(()=> {
        dispatch(notLoading());
        dispatch(successMsg('Your account and all personal data are removed', '/login'));
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message));
      }).catch(err => {
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

const EvidenceResForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(EvidenceForm)
 
export default EvidenceResForm