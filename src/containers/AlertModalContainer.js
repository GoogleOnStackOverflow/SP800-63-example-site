import { connect } from 'react-redux'
import { closeMsgModal } from '../actions'
import AlertModal from '../components/AlertModal.js'

const mapStateToProps = (state, ownProps) => {
  return {
    msg: state.show.errMsg
  }
}

const mapDispatchToProps = dispatch => {
  return {
    closeOnClick: () => {
      dispatch(closeMsgModal());
    },
  }
}

const AlertModalContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AlertModal)
 
export default AlertModalContainer