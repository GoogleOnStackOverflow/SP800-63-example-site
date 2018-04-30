import { connect } from 'react-redux';
import AdminLogin from '../components/AdminLogin';
import { loading, notLoading, errorMsg } from '../actions';
import { loginWithSignature } from '../firebaseActions'

const getQuery = (search) => {
  if(!search) return {};
  let s = search.split('?')[1];
  let queryStrings = s.split('&');
  let toReturn = {};
  for(var i=0; i<queryStrings.length; i++) {
    let query = queryStrings[i].split('=');
    toReturn[query[0]] = decodeURIComponent(query[1]);
  }

  return toReturn;
}

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

      let query = getQuery(search)

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