import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from "react-router-dom"
import { Alert, Button } from 'react-bootstrap'
import CheckModal from '../containers/CheckModal'
import { hasCurrentUser, currentUserEmailVerified } from '../firebaseActions'

class VerifyEmail extends React.Component {
  constructor(props){
    super(props);
    if(!hasCurrentUser()) this.props.history.push('/login');
    if(currentUserEmailVerified()) this.props.history.push('/evidenceres');
  }

  render() {
    const {handleCancel, handleRemove, handleResend, handleRelog} = this.props
    return (
      <Alert bsStyle="warning">
        <CheckModal cancelOnClick={()=>{}} okOnClick={handleRemove} />
        <h4>Email address not verified yet</h4>
        <p>Please check your mail box and follow the steps in the mail to verify your email address.</p>
        <p>If you did not recieve an email, please try to</p>
        <p>
          <Button 
            bsStyle='danger' 
            onClick={handleCancel}>
            Cancel the registration
          </Button>
          <span> or </span>
          <Button onClick={handleResend}>Send me the mail again</Button>
          <span> or </span>
        </p>
        <p>If you have verified your address, please try to login again</p>
        <p>
          <Button onClick={handleRelog}>Login again</Button>
        </p>
      </Alert>
    );
  }
}

VerifyEmail.propTypes = {
  handleCancel: PropTypes.func,
  handleRemove: PropTypes.func,
  handleResend: PropTypes.func,
  handleRelog: PropTypes.func
}

export default withRouter(VerifyEmail);