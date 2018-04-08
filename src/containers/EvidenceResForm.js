import { connect } from 'react-redux';
import EvidenceForm from '../components/EvidenceForm';
import { loading, notLoading, errorMsg, successMsg } from '../actions';
import { uploadUserEvidences } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {}

const mapDispatchToProps = dispatch => {
  return {
    handleSubmit: (images) => {
      dispatch(loading());
      uploadUserEvidences(images)
      .then(()=> {
        dispatch(notLoading());
        // TODO success nav should be piires
        dispatch(successMsg('Evidences are updated successfully','/verifypii'));
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
    }
  }
}

const EvidenceResForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(EvidenceForm)
 
export default EvidenceResForm