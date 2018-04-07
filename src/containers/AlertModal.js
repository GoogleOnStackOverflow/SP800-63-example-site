import { connect } from 'react-redux'
import { closeAlert } from '../actions'
import MessageModal from '../components/MessageModal'

const mapStateToProps = (state, ownProps) => {
  return {
    title: state.show.alertTitle,
    msg: state.show.alertMsg,
    onCloseNavPath: state.show.alertNav
  }
}

const mapDispatchToProps = dispatch => {
  return {
    closeOnClick: () => {
      dispatch(closeAlert());
    }
  }
}

const AlertModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(MessageModal)
 
export default AlertModal