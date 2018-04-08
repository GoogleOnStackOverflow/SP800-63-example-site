import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from "react-router-dom"
import { Alert, Button } from 'react-bootstrap'
import CheckModal from '../containers/CheckModal'
import { hasCurrentUser, getUserInfoFromDbPromise } from '../firebaseActions'

class VerifyPII extends React.Component {
  constructor(props){
    super(props);
    if(!hasCurrentUser()) this.props.history.push('/login');
    this.props.dispatchLoading();
    getUserInfoFromDbPromise().then(snapshot => {
      this.props.dispatchNotLoading();
      if(snapshot.val() && snapshot.val().piiVerified)
        this.props.history.push('/deliverotp');
    })
  }

  render() {
    const {handleCancel, handleRemove, handleRelog, history} = this.props
    return (
      <Alert bsStyle="warning">
        <CheckModal cancelOnClick={()=>{}} okOnClick={handleRemove} />
        <h4>Your personal information is under validation and verification</h4>
        <p>This would usually take 3-5 days</p>
        <p>You may stop the registration process any time, all personal data and sensitive information would by removed immediately</p>
        <p>
          <Button 
            bsStyle='danger' 
            onClick={handleCancel}>
            Cancel the registration
          </Button>
        </p>
        <p>If you have been notified passed in verification, please try to </p>
        <p>
          <Button onClick={()=>{handleRelog(history)}}>Login again</Button>
        </p>
      </Alert>
    );
  }
}

VerifyPII.propTypes = {
  dispatchLoading: PropTypes.func,
  dispatchNotLoading: PropTypes.func,
  handleCancel: PropTypes.func,
  handleRemove: PropTypes.func,
  handleRelog: PropTypes.func
}

export default withRouter(VerifyPII);