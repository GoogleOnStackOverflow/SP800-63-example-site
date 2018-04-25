import { connect } from 'react-redux';
import UpdateOTP from '../components/UpdateOTP';
import { loading, notLoading, errorMsg } from '../actions';

const mapStateToProps = (state, ownProps) => {
  return {}
}

const mapDispatchToProps = dispatch => {
  return {
    handleCancel: (history) => {
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
)(UpdateOTP)