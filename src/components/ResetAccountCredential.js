import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from "react-router-dom"
import { Button, Form, FormGroup, 
  FormControl, HelpBlock, Col, ControlLabel,
  Image, Thumbnail } from 'react-bootstrap'
import { hasCurrentUser, getCurrentUserEmail, emailUnderRecover } from '../firebaseActions'

class ResetAccountCredential extends React.Component {
  constructor(props){
    super(props);
    this.props.dispatchLoading();

    if(!hasCurrentUser()) {
      this.props.dispatchNotLoading();
      this.props.dispatchErrMsg('Permission denied. Please login again to solve this.', '/login');
    } else {
      this.props.dispatchNotLoading();
    }

    emailUnderRecover(getCurrentUserEmail()).then(result => {
      this.props.dispatchNotLoading()
      if(!result)
        this.props.dispatchErrMsg('Your account is not under recover. Please start a recover process to access this page', '/login');
    }, err => {
      this.props.dispatchNotLoading();
      this.props.dispatchErrMsg(err.message, '/login');
    })

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
    let {state, imageUrl, secret, secret32, handleOnChange, handleCancel, setUpOnClick, generateOnClick, verifyOnClick} = this.props;
    let {onChanging, verified} = this.state;
    return (<Form>
        <h4>Please reset your password</h4>
        <FormGroup 
          validationState={state['FORM_REG_PWD'] && state['FORM_REG_PWD'].length<8?'error':'success'}
          controlId="formHorizontalPassword">
          <Col componentClass={ControlLabel} sm={2}>
            Set your password
          </Col>
          <Col sm={10}>
            <FormControl 
              type='password'
              placeholder='password'
              onChange = {(e) => {
                handleOnChange('FORM_REG_PWD', e.target.value);
              }}
            />
            <HelpBlock>A Password should be at least 8 in length</HelpBlock>
          </Col>
        </FormGroup>
        <FormGroup 
          validationState={state['FORM_REG_PWD']===state['FORM_REG_PWD_CHECK']?'success':'error'}
          controlId="formHorizontalPassword">
          <Col componentClass={ControlLabel} sm={2}>
            check the password
          </Col>
          <Col sm={10}>
            <FormControl 
              type='password' 
              placeholder= 'password'
              onChange = {(e) => {
                handleOnChange('FORM_REG_PWD_CHECK', e.target.value);
              }}
            />
            <HelpBlock>Check the password by type it again.</HelpBlock>
          </Col>
        </FormGroup>
        <h4>Please reset your OTP credential</h4>
        <Thumbnail>
          <h4 align='middle'>Set up 2-Factor Verification</h4> 
          <p align='middle'>
            <Image align='middle' src={imageUrl} thumbnail/>
          </p>
          <p align='middle'>{secret32}</p>
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
          disabled={onChanging 
            || !verified || !state['FORM_REG_PWD'] 
            || state['FORM_REG_PWD'].length<8
            || state['FORM_REG_PWD_CHECK'] !== state['FORM_REG_PWD']
          }
          onClick={()=>{setUpOnClick(secret, state)}}>
          Reset my login credentials
        </Button>
        <Button onClick={handleCancel}>Cancel the recovery process</Button>
      </Form>);
  }
}

ResetAccountCredential.propTypes = {
  state: PropTypes.obj,
  imageUrl: PropTypes.string,
  secret: PropTypes.string,
  secret32: PropTypes.string,
  handleOnChange: PropTypes.func,
  handleCancel: PropTypes.func,
  setUpOnClick: PropTypes.func, 
  generateOnClick: PropTypes.func, 
  verifyOnClick: PropTypes.func,
  dispatchLoading: PropTypes.func,
  dispatchNotLoading: PropTypes.func,
  dispatchErrMsg: PropTypes.func
}

export default withRouter(ResetAccountCredential)