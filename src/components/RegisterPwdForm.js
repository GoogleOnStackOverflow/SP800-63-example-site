import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from "react-router-dom";
import { Form, FormGroup, FormControl, Button, ControlLabel , Col, HelpBlock } from 'react-bootstrap';
import { FORM_USR, isEmail } from './LoginForm'

class RegisterPasswordForm extends React.Component {
  constructor(props){
    super(props); 
    if(!isEmail(this.props.state[FORM_USR])) this.props.history.push('/login');
  }

  render() {
    const {state, handleOnChange, submitOnClick, cancelOnClick, history} = this.props
    return (
      <Form horizontal>
        <FormGroup controlId="title">
          <h4 align='middle'>Sign On</h4>
        </FormGroup>
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

        <FormGroup >
          <Col smOffset={2} sm={10}>
            <Button 
              onClick={()=>{cancelOnClick(history)}}>
              Cancel
            </Button>
            <Button 
              disabled={!state['FORM_REG_PWD'] || state['FORM_REG_PWD'].length<8 
                || state['FORM_REG_PWD']!==state['FORM_REG_PWD_CHECK']}
              onClick={()=>{submitOnClick(state, history)}}>
              Next
            </Button>
          </Col>
        </FormGroup>
      </Form>
    );
  }
}

RegisterPasswordForm.propTypes = {
  state: PropTypes.obj,
  handleOnChange: PropTypes.func, 
  submitOnClick: PropTypes.func,
  cancelOnClick: PropTypes.func
}

export default withRouter(RegisterPasswordForm);