import { connect } from 'react-redux'
import CoveringModal from '../components/CoveringModal'

const mapStateToProps = (state, ownProps) => {
  let contentObj = state.show.covering;

  return {
    isShow: contentObj? true : false,
    title: contentObj? contentObj.title : '',
    content: contentObj ? contentObj.content : ''
  }
}

const mapDispatchToProps = dispatch => {
  return {}
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CoveringModal)