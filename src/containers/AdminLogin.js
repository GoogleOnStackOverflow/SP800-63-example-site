import { connect } from 'react-redux';
import AdminLogin from '../components/AdminLogin';
import { loading, notLoading, errorMsg } from '../actions';
import { loginWithSignature } from '../firebaseActions'
import * as qs from 'query-string'

const mapStateToProps = (state, ownProps) => {
  return {};
}

const mapDispatchToProps = dispatch => {
  return {
    handleLoginEvent: (search, history) => {
      dispatch(loading());
      if(!search) {
        dispatch(notLoading());
        return dispatch(errorMsg('Bad Request. Please use the delivered authenticator to access this page.', '/login'));
      }

      let query = qs.parse(search)

      if(!query || !query.tkn || !query.sig) {
        dispatch(notLoading());
        return dispatch(errorMsg('Bad Request. Please use the delivered authenticator to access this page.', '/login'));
      }
      
      loginWithSignature(query.tkn, query.sig).then(() => {
        dispatch(notLoading());
        history.push('/adminservice')
      }, err => {
        dispatch(notLoading());
        dispatch(errorMsg(err.message, '/login'));
      })
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AdminLogin)