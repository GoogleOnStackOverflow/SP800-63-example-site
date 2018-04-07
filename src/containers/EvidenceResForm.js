import { connect } from 'react-redux';
import EvidenceForm from '../components/EvidenceForm';
import { loading, notLoading, errorMsg, successMsg } from '../actions';
import { } from '../firebaseActions'

const mapStateToProps = (state, ownProps) => {}

const mapDispatchToProps = dispatch => {
  return {
    handleSubmit: (e) => {
      dispatch(loading());
      console.log(e);
      dispatch(notLoading());
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