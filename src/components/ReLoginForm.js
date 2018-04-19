import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from "react-router-dom"
import { Form, FormGroup, FormControl, Button, ControlLabel ,Col, Modal } from 'react-bootstrap'

const ReLoginForm = ({handleOnChange, state, handleCancel, handleReAuth, history, successRoute}) => {
  return (
    <Modal show={successRoute? true : false} onHide={()=> {handleCancel()}}>
      <Form horizontal>
        <FormGroup>
          <h4>Re-authenticate</h4>
          <p>Please re-auth before furthur operations</p>
        </FormGroup>
        <FormGroup controlId="formHorizontalEmail">
          <Col componentClass={ControlLabel} sm={2}>
            Password
          </Col>
          <Col sm={10}>
            <FormControl 
              type="password" 
              placeholder="password" 
              onChange = {(e) => {
                handleOnChange('FORM_PWD', e.target.value);
              }}
              value={state['FORM_PWD']}
            />
          </Col>
        </FormGroup>
        <FormGroup controlId="formHorizontalEmail">
        <Col componentClass={ControlLabel} sm={2}>
          OTP
        </Col>
        <Col sm={10}>
          <FormControl 
            type="password" 
            placeholder="OTP" 
            onChange = {(e) => {
              handleOnChange('FORM_OTP', e.target.value);
            }}
            value={state['FORM_OTP']}
          />
        </Col>
        </FormGroup>

        <FormGroup>
          <Col smOffset={2} sm={10}>
            <Button onClick={()=>{handleCancel()}}>
              Cancel
            </Button>
            <Button 
              onClick={()=>{handleReAuth(state, history, successRoute)}}
              disabled={state['FORM_PWD'] && state['FORM_OTP']}>
              Re-auth me
            </Button>
          </Col>
        </FormGroup>
      </Form>
    </Modal>
  );
}

ReLoginForm.propTypes = {
  state: PropTypes.obj,
  prevRoute: PropTypes.string,
  successRoute: PropTypes.string,
  handleOnChange: PropTypes.func,
  handleCancel: PropTypes.func,
  handleReAuth: PropTypes.func
}

export default withRouter(ReLoginForm);