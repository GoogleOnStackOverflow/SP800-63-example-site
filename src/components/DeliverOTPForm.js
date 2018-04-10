import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from "react-router-dom";
import { Form, FormGroup, FormControl, Button, ControlLabel , Col, HelpBlock, Image, Thumbnail } from 'react-bootstrap';
import { hasCurrentUser, getUserInfoFromDbPromise, getCurrentUserEmail } from '../firebaseActions'

class DeliverOTPForm extends React.Component {
  constructor(props){
    super(props);
    if(!hasCurrentUser()) this.props.history.push('/login');
    if(!this.props.disableAutoRedirect){
      this.props.dispatchLoading();
      getUserInfoFromDbPromise().then(snapshot => {
        this.props.dispatchNotLoading();
        if(snapshot && snapshot.val() && snapshot.val().otpCredential)
          this.props.history.push('/loginotp');
      })
    }
    
    this.state = {
      onChanging: false,
      verified: false
    }
  }

  componentDidMount() {
    if(!this.props.state['FORM_OTP_ACCOUNT'])
      this.props.handleOnChange('FORM_OTP_ACCOUNT', getCurrentUserEmail());
    this.props.generateOnClick(this.props.state);
  }

  render() {
    let {state, imageUrl, secret, secret32, handleOnChange, setUpOnClick, generateOnClick, verifyOnClick} = this.props
    let {verified, onChanging} = this.state;

    return (
      <Form horizontal>
        <Thumbnail>
          <h4>Set up 2-Factor Verification</h4> 
          <Image src={imageUrl} thumbnail/>
          <p>{secret32}</p>
          <FormGroup 
            validationState={(state['FORM_OTP_ACCOUNT'] && state['FORM_OTP_ACCOUNT'] !== '')? 'success' : 'error'}
            controlId='FORM_OTP_ACCOUNT'>
            <Col componentClass={ControlLabel} sm={2}>        
              <p>AccountName</p>
            </Col>
            <Col sm={10}>
              <FormControl 
                type='text'
                placeholder='Account Name'
                onChange = {(e) => {
                  this.setState({onChanging: true});
                  handleOnChange('FORM_OTP_ACCOUNT', e.target.value);
                }}
                value={state['FORM_OTP_ACCOUNT']}
              />
              <HelpBlock>Please enter the account name you want to show on your Google Auth App. It cannot be empty</HelpBlock>
            </Col>
          </FormGroup>
          <FormGroup >
            <Col smOffset={2} sm={10}>
              <Button
                disabled={!onChanging || !state['FORM_OTP_ACCOUNT']}
                onClick={()=>{
                  this.setState({onChanging: false, verified: false});
                  generateOnClick(state)}}>
                Generate the QR Code
              </Button>
              <HelpBlock>Please scan the generated QR Code using Google Auth App, and use the OTP to enable your account</HelpBlock>
            </Col>
          </FormGroup>
        </Thumbnail>
        <FormGroup 
          disabled={onChanging}
          controlId='FORM_OTP'>
          <Col componentClass={ControlLabel} sm={2}>        
            <p>Verify OTP</p>
          </Col>
          <Col sm={10}>
            <FormControl    
              type='text'
              placeholder='OTP'
              onChange = {(e) => {
                handleOnChange('FORM_OTP', e.target.value);
              }}
              value={state['FORM_OTP']}
            />
            <Button 
              disabled={onChanging}
              onClick={()=>{verifyOnClick(state, secret, ()=> {
                this.setState({verified: true})
              })}}>
              Verify
            </Button>
            <HelpBlock>Please enter the OTP of your account shown on your app</HelpBlock>
          </Col>
        </FormGroup>
        <Button 
          disabled={onChanging || !verified}
          onClick={()=>{setUpOnClick(secret)}}>
          Set Up
        </Button>
      </Form>
    );
  }
}

DeliverOTPForm.propTypes = {
  state: PropTypes.obj,
  disableAutoRedirect: PropTypes.bool,
  imageUrl: PropTypes.string,
  secret: PropTypes.string,
  secret32: PropTypes.string,
  handleOnChange: PropTypes.func, 
  setUpOnClick: PropTypes.func, 
  generateOnClick: PropTypes.func, 
  verifyOnClick: PropTypes.func,
  dispatchLoading: PropTypes.func,
  dispatchNotLoading: PropTypes.func
}

export default withRouter(DeliverOTPForm);