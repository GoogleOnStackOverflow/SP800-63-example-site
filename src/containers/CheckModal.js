import { connect } from 'react-redux'
import { closeCheck } from '../actions'
import CheckingModal from '../components/CheckingModal'

const mapStateToProps = (state, ownProps) => {
  return {
    title: state.show.checkTitle,
    msg: state.show.checkMsg,
    onCancelNav: state.show.checkNoNav,
    onOkNav: state.show.checkYesNav,
    cancelOnClick: ownProps.cancelOnClick,
    okOnClick: ownProps.okOnClick
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleClose: () => {
      dispatch(closeCheck());
    }
  }
}

const CheckModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(CheckingModal)
 
export default CheckModal