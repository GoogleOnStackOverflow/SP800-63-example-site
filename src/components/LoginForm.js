import React from 'react';
import PropTypes from 'prop-types';
import { Form, FormGroup, FormControl, Button, ControlLabel ,Col } from 'react-bootstrap';

const FORM_PWD = 'FORM_PWD';
const FORM_USR = 'FORM_USR';

const LoginForm = ({submitOnClick, handleOnChange, state}) => {
  return (
    <Form horizontal>
        <FormGroup controlId="formHorizontalEmail">
        <Col componentClass={ControlLabel} sm={2}>
          Email
        </Col>
        <Col sm={10}>
          <FormControl 
            type="text" 
            placeholder="Email" 
            onChange = {(e) => {
              handleOnChange(FORM_USR, e.target.value);
            }}
          />
        </Col>
        </FormGroup>

        <FormGroup controlId="formHorizontalPassword">
        <Col componentClass={ControlLabel} sm={2}>
          Password
        </Col>
        <Col sm={10}>
          <FormControl 
            type="password" 
            placeholder="Password" 
            onChange = {(e) => {
              handleOnChange(FORM_PWD, e.target.value);
            }}
          />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col smOffset={2} sm={10}>
          <Button onClick={submitOnClick(state[FORM_USR], state[FORM_PWD])}>
            Sign in
          </Button>
        </Col>
      </FormGroup>
    </Form>
  );
}

LoginForm.propTypes = {
  state: PropTypes.obj,
  handleOnChange: PropTypes.func, 
  submitOnClick: PropTypes.func
}

export default LoginForm;