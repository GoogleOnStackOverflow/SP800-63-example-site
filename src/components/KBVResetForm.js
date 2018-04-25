import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from "react-router-dom"
import { Form, FormGroup, FormControl, Button, ControlLabel, Col } from 'react-bootstrap'
import { checkID, checkBirthDay } from './RegisterPIIForm'
import { emailUnderRecover } from '../firebaseActions'

class KBVResetForm extends React.Component {
  constructor(props){
    super(props);
    this.props.dispatchLoading();
    if(!this.props.state['FORM_USR']){
      this.props.dispatchNotLoading();
      this.props.dispatchErrMsg('Recovery account not specified.', '/login');
    }

    emailUnderRecover(this.props.state['FORM_USR']).then(result => {
      this.props.dispatchNotLoading();
      if(result)
        this.props.history.push('/resetemail');
    }, err => {
      this.props.dispatchNotLoading();
      this.props.dispatchErrMsg(err.message, '/login');
    })
  }

  render() {
    let { handleOnChange, state, handleSubmit, handleCancel, history } = this.props;
    return (
      <Form horizontal>
        <FormGroup>
          <Col align='middle'>
            <h4>Reset your account</h4>
            <p>We would have to check your identity before starting the reset process</p>
            <p>Through this process, we'll check the address of record and some personal information of you.</p>
            <p>You would have to reset your password and OTP credential to recover your account</p>
          </Col>
        </FormGroup>
        <FormGroup 
          controlId="formHorizontalID"
          validationState={state['FORM_RESET_ID']? (checkID(state['FORM_RESET_ID'])? 'success' : 'error') : null}>
          <Col componentClass={ControlLabel} sm={2}>
            ROC ID
          </Col>
          <Col sm={10}>
            <FormControl 
              type="text" 
              placeholder="身分證字號" 
              onChange = {(e) => {
                handleOnChange('FORM_RESET_ID', e.target.value);
              }}
              value={state['FORM_RESET_ID']}
            />
          </Col>
        </FormGroup>
        <FormGroup 
        controlId="formHorizontalBirthday"
        validationState={state['FORM_RESET_BIRTHDAY']? (checkBirthDay(state['FORM_RESET_BIRTHDAY'])? 'success' : 'error') : null}>
          <Col componentClass={ControlLabel} sm={2}>
            Birthday
          </Col>
          <Col sm={10}>
            <FormControl 
              type="text" 
              placeholder="yyyymmdd" 
              onChange = {(e) => {
                handleOnChange('FORM_RESET_BIRTHDAY', e.target.value);
              }}
              value={state['FORM_RESET_BIRTHDAY']}
            />
          </Col>
        </FormGroup>

        <FormGroup>
          <Col smOffset={2} sm={10}>
            <Button onClick={()=>{handleCancel(history)}}>
              Cancel
            </Button>
            <Button 
              onClick={()=>{handleSubmit(state)}}
              disabled={!state['FORM_RESET_ID'] 
                || !state['FORM_RESET_BIRTHDAY']
                || !checkID(state['FORM_RESET_ID'] )
                || !checkBirthDay(state['FORM_RESET_BIRTHDAY'])
              }>
              Recover my Account
            </Button>
          </Col>
        </FormGroup>
      </Form>
    );
  }
}

KBVResetForm.propTypes = {
  state: PropTypes.obj,
  handleOnChange: PropTypes.func,
  handleCancel: PropTypes.func,
  handleSubmit: PropTypes.func,
  dispatchErrMsg: PropTypes.func,
  dispatchLoading: PropTypes.func,
  dispatchNotLoading: PropTypes.func
}

export default withRouter(KBVResetForm);