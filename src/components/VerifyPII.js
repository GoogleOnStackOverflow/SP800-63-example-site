import React from 'react'
import PropTypes from 'prop-types'
import * as firebase from 'firebase'
import { withRouter } from "react-router-dom"
import { Alert, Button, Form, FormGroup, FormControl, ControlLabel , Col, HelpBlock } from 'react-bootstrap'
import CheckModal from '../containers/CheckModal'
import { hasCurrentUser, currentUserPIIVerified, currentUserPhoneVerified } from '../firebaseActions'

class VerifyPhoneNum extends React.Component {
  constructor(props){
    super(props);
    this.state = {sendEnabled: false, codeEnabled: false};
    this.setCodeEnable.bind(this);
    this.setSendEnabled.bind(this);
  }

  componentDidMount() {
    let setSendEnabled = enable => this.setState({sendEnabled: enable});
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(this.recaptcha, {
      'size': 'normal',
      'callback': function (response) {
        setSendEnabled(true);
      },
      'expired-callback': function () {
        // Response expired. Ask user to solve reCAPTCHA again.
        setSendEnabled(false);
      }
    });
      window.recaptchaVerifier.render().then(function (widgetId) {
      window.recaptchaWidgetId = widgetId;
    });
  }

  setSendEnabled(enable) {
    this.setState({sendEnabled: enable});
  }

  setCodeEnable(enable) {
    this.setState({codeEnabled: enable});
  }

  render() {
    const {state, handleSendSMS, handleCodeVerification, handleOnChange} = this.props
    return (<Alert bsStyle="warning" >
        <h4>Your phone number is not verified yet</h4>
        <p>Please check the reCAPTCHA box and press the "send me the code" button below</p>
        <div ref={(ref)=>this.recaptcha=ref}></div>
        <p>
          <Button 
            disabled={!this.state.sendEnabled}
            onClick={()=> {
              handleSendSMS(()=>{
                this.setCodeEnable(true);
                this.setSendEnabled(false);
              });
            }}>
            Send me the code
          </Button>
        </p>
        <Form>
          <FormGroup 
            controlId='VerificationCode'>
            <Col componentClass={ControlLabel} sm={2}>        
            <p>Verification Code</p>
            </Col>
            <Col componentClass={ControlLabel} sm={2}>
            </Col>
            <Col sm={10}>
              <FormControl
                disabled={!this.state.codeEnabled}
                type='text'
                placeholder='Phone Number Verification Code'
                onChange = {(e) => {
                  handleOnChange('FORM_PII_REG_PHONE_CODE', e.target.value);
                }}
                value={state['FORM_PII_REG_PHONE_CODE']}
              />
            <HelpBlock>Please pass the reCAPTCHA before fill this</HelpBlock>
          </Col>
          </FormGroup>
        </Form>
        <p>
          <Button onClick={()=>{handleCodeVerification(state)}}>Verify</Button>
        </p>
      </Alert>);
  }
}

class VerifyPII extends React.Component {
  constructor(props){
    super(props);

    this.state = {showPhoneVerifier: true};
    if(!hasCurrentUser()) this.props.history.push('/login');
    this.props.dispatchLoading();
    currentUserPIIVerified().then(result => {
      this.props.dispatchNotLoading();
      if(result)
        this.props.history.push('/deliverotp');
    }, err => {
      this.props.dispatchNotLoading();
      this.props.dispatchErrMsg(err);
    })
  }

  componentDidMount() {
    this.props.dispatchLoading();
    currentUserPhoneVerified().then(result => {
      this.props.dispatchNotLoading();
      if(result)
        this.setState({showPhoneVerifier: false});
    }, err => {
      this.props.dispatchNotLoading();
      this.props.dispatchErrMsg(err);
    })
  }

  render() {
    const {state, handleCancel, handleRemove, handleRelog, handleSendSMS, handleCodeVerification, handleOnChange} = this.props

    return (
      <div>
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
            <Button onClick={handleRelog}>Login again</Button>
          </p>
        </Alert>
        {this.state.showPhoneVerifier?<VerifyPhoneNum
          state={state} handleSendSMS={handleSendSMS}
          handleCodeVerification={handleCodeVerification}
          handleOnChange={handleOnChange}/> : <div/>}
      </div>
    );
  }
}

VerifyPII.propTypes = {
  state: PropTypes.obj,
  dispatchLoading: PropTypes.func,
  dispatchNotLoading: PropTypes.func,
  handleCancel: PropTypes.func,
  handleRemove: PropTypes.func,
  handleRelog: PropTypes.func,
  handleSendSMS: PropTypes.func,
  handleCodeVerification: PropTypes.func,
  handleOnChange: PropTypes.func,
  dispatchErrMsg: PropTypes.func
}

export default withRouter(VerifyPII);