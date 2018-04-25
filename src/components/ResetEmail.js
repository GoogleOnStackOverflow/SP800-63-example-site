import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { Alert, Button } from 'react-bootstrap'
import { emailUnderRecover } from '../firebaseActions'

class ResetEmail extends React.Component {
  constructor(props){
    super(props);
    this.props.dispatchLoading();

    if(!this.props.emailTarget){
      this.props.dispatchNotLoading();
      this.props.dispatchErrMsg('No recovery account specified', '/login');
    }
      
    emailUnderRecover(this.props.emailTarget).then((result) => {
      this.props.dispatchNotLoading();
      if(!result)
        this.props.dispatchErrMsg('Account does not exists or is not under recovery process', '/login');
    }, err => {
      this.props.dispatchNotLoading();
      this.props.dispatchErrMsg(err.message);
    })
  }

  render() {
    const {emailTarget, handleResend, handleCancel} = this.props
    return (
      <Alert bsStyle="warning">
        <h4>A reset email has been sent to the mailbox</h4>
        <p>Please check your mail box and use the link in your mail to continue the recover process.</p>
        <p>If you did not recieve an email, please try to</p>
        <p>
          <Button onClick={() => {handleCancel(emailTarget)}}>Cancel the recover process</Button>
        </p>
        <swap>or</swap>
        <p>
          <Button onClick={() => {handleResend(emailTarget)}}>Send me the mail again</Button>
        </p>
      </Alert>
    );
  }
}

ResetEmail.propTypes = {
  emailTarget: PropTypes.string,
  handleResend: PropTypes.func,
  dispatchErrMsg: PropTypes.func,
  dispatchLoading: PropTypes.func,
  dispatchNotLoading: PropTypes.func
}

export default withRouter(ResetEmail);