import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from "react-router-dom"
import { Alert, Button } from 'react-bootstrap'
import { hasCurrentUser, getUserPII } from '../firebaseActions'
import DeliverOTPPage from '../containers/DeliverOTPPage'

class UpdateOTP extends React.Component {
  constructor(props){
    super(props);
    this.props.dispatchLoading();

    if(!hasCurrentUser()) {
      this.props.dispatchNotLoading();
      this.props.dispatchErrMsg('Permission denied. Please login again to solve this.', '/login');
    } else {
      getUserPII().then(()=> {
        this.props.dispatchNotLoading();
      }, err => {
        this.props.dispatchNotLoading();
        this.props.dispatchErrMsg(`${err.message}. Sorry for the error. Please login again to resolve this.`, '/login');
      })
    }
  }

  render() {
    let { handleCancel, history } = this.props;
    return (<Alert bsStyle="warning" >
        <h4>Please reset your OTP credential</h4>
        <DeliverOTPPage disableAutoRedirect={true} />
        <Button onClick={()=>{handleCancel(history)}}>Cancel</Button>
      </Alert>);
  }
}

UpdateOTP.propTypes = {
  handleCancel: PropTypes.func,
}

export default withRouter(UpdateOTP)