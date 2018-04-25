import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from "react-router-dom"
import { Alert, Button, Form, FormGroup, FormControl, ControlLabel , Col, HelpBlock } from 'react-bootstrap'
import { hasCurrentUser, getUserPII } from '../firebaseActions'

class UpdatePassword extends React.Component {
  constructor(props){
    super(props);
    this.props.dispatchLoading();
    this.props.handleOnChange('FORM_REG_PWD','');
    this.props.handleOnChange('FORM_REG_PWD_CHECK','');

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
    const {state,handleOnChange, cancelOnClick, submitOnClick, history} = this.props
    return (<Alert bsStyle="warning" >
        <h4>Please enter your new password</h4>
          <Form horizontal>
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
                Done
              </Button>
            </Col>
          </FormGroup>
        </Form>
      </Alert>);
  }
}

UpdatePassword.propTypes = {
  state: PropTypes.obj, 
  cancelOnClick: PropTypes.func, 
  submitOnClick: PropTypes.func, 
  handleOnChange: PropTypes.func
}

export default withRouter(UpdatePassword)