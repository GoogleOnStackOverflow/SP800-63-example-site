import { connect } from 'react-redux'
import { closeAlert } from '../actions'
import LoadingModal from '../components/LoadingModal'

const mapStateToProps = (state, ownProps) => {
  return {
    isShow: state.show.loading
  }
}

const mapDispatchToProps = dispatch => {
  return {}
}

const LoadingSpin = connect(
  mapStateToProps,
  mapDispatchToProps
)(LoadingModal)
 
export default LoadingSpin