import React from 'react'
import PropTypes from 'prop-types'
import * as firebase from 'firebase'
import { withRouter } from "react-router-dom"
import { Alert, Button, Form, FormGroup, FormControl, ControlLabel , Col, HelpBlock } from 'react-bootstrap'
import { loginWithEmailLink } from '../firebaseActions'

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

class ResetVerifyPhone extends React.Component {
  constructor(props){
    super(props);
    this.props.dispatchLoading();
    this.props.handleOnChange('FORM_PII_REG_PHONE_CODE','');

    loginWithEmailLink(
      JSON.parse(getQuery(this.props.location.search).email), 
      window.location.href).then(() => {
      this.props.dispatchNotLoading();
    }, err => {
      this.props.dispatchNotLoading();
      this.props.dispatchErrMsg(err.message, '/login');
    })

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
    const {state, handleSendSMS, handleCodeVerification, handleOnChange, handleCancel} = this.props
    return (<Alert bsStyle="warning" >
        <h4>Please verify your identity by the phone number of record</h4>
        <p>Please check the reCAPTCHA box and press the "send me the code" button below</p>
        <div ref={(ref)=>this.recaptcha=ref}></div>
        <p>
          <Button 
            disabled={!this.state.sendEnabled}
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
          <Button onClick={handleCancel}>Cancel</Button>
          <Button 
            disabled={!state['FORM_PII_REG_PHONE_CODE']}
            onClick={()=>{handleCodeVerification(state)}}>
            Verify
          </Button>
        </p>
      </Alert>);
  }
}

ResetVerifyPhone.propTypes = {
  state: PropTypes.obj, 
  handleSendSMS: PropTypes.func,
  handleCodeVerification: PropTypes.func, 
  handleOnChange: PropTypes.func, 
  handleCancel: PropTypes.func,
  dispatchLoading: PropTypes.func,
  dispatchNotLoading: PropTypes.func,
  dispatchErrMsg: PropTypes.func
}

export default withRouter(ResetVerifyPhone)