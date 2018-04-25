import React from 'react'
import PropTypes from 'prop-types'
import * as firebase from 'firebase'
import { withRouter } from "react-router-dom"
import { Alert, Button, Form, FormGroup, FormControl, ControlLabel , Col, HelpBlock } from 'react-bootstrap'
import { hasCurrentUser, getUserPII } from '../firebaseActions'

const checkPhone = (num) => {
  if(!/^[0-9]{10}$/.test(num))
    return false;
  return num.indexOf('09') === 0;
}

class UpdatePhoneNum extends React.Component {
  constructor(props){
    super(props);
    this.props.dispatchLoading();
    this.props.handleOnChange('FORM_PII_REG_PHONE','');
    this.props.handleOnChange('FORM_PII_REG_PHONE_CODE','');

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
    const {state, handleSendSMS, handleCodeVerification, handleOnChange, handleCancel, history} = this.props
    return (<Alert bsStyle="warning" >
        <h4>Please enter your phone number and verify it</h4>
        <Form>
          <FormGroup 
            controlId='updateNewPhone'>
            <Col componentClass={ControlLabel} sm={2}>        
            <p>Phone Number</p>
            </Col>
            <Col componentClass={ControlLabel} sm={2}>
            </Col>
            <Col sm={10}>
              <FormControl
                type='text'
                placeholder='Phone Number'
                onChange = {(e) => {
                  handleOnChange('FORM_PII_REG_PHONE', e.target.value);
                }}
                value={state['FORM_PII_REG_PHONE']}
                readOnly={this.state.codeEnabled}
              />
            <HelpBlock>Enter your phone number here</HelpBlock>
          </Col>
          </FormGroup>
        </Form>
        <p>Please check the reCAPTCHA box and press the "send me the code" button below</p>
        <div ref={(ref)=>this.recaptcha=ref}></div>
        <p>
          <Button 
            disabled={!checkPhone(state['FORM_PII_REG_PHONE']) || !this.state.sendEnabled}
            onClick={()=> {
              handleSendSMS(()=>{
                this.setCodeEnable(true);
                this.setSendEnabled(false);
              }, state);
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
          <Button onClick={()=>{handleCancel(history)}}>Cancel</Button>
          <Button 
            disabled={!state['FORM_PII_REG_PHONE_CODE'] || !state['FORM_PII_REG_PHONE']}
            onClick={()=>{handleCodeVerification(state)}}>
            Verify and Update
          </Button>
        </p>
      </Alert>);
  }
}

UpdatePhoneNum.propTypes = {
  state: PropTypes.obj, 
  handleSendSMS: PropTypes.func, 
  handleCodeVerification: PropTypes.func, 
  handleOnChange: PropTypes.func, 
  handleCancel: PropTypes.func,
}

export default withRouter(UpdatePhoneNum)