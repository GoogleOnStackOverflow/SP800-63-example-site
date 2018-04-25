import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from "react-router-dom";
import { Form, FormGroup, FormControl, Button, ControlLabel ,Col } from 'react-bootstrap';
import { FORM_USR, isEmail } from './LoginForm'

const textIsEmpty = (text) => {
  return !text || text.length === 0;
}

class PasswordForm extends React.Component {
  constructor(props){
    super(props); 
    if(!isEmail(this.props.state[FORM_USR])) this.props.history.push('/login');
  }

  render() {
    const {title, placeHolder, formName, state, handleOnChange, submitOnClick, cancelOnClick, history} = this.props
    return (
      <Form horizontal>
        <FormGroup controlId="title">
          <h4 align='middle'>Login</h4>
        </FormGroup>
        <FormGroup controlId="formHorizontalPassword">
          <Col componentClass={ControlLabel} sm={2}>
            {title}
          </Col>
          <Col sm={10}>
            <FormControl 
              type="password" 
              placeholder= {placeHolder}
              onChange = {(e) => {
                handleOnChange(formName, e.target.value);
              }}
            />
          </Col>
        </FormGroup>

        <FormGroup>
          <Col smOffset={2} sm={10}>
            <Button 
              onClick={()=>{cancelOnClick(history)}}>
              Cancel
            </Button>
            <Button 
              disabled={textIsEmpty(state[formName])}
              onClick={()=>{submitOnClick(state, history)}}>
              Next
            </Button>
          </Col>
        </FormGroup>

        <FormGroup>
          <Col smOffset={2} sm={10}>
            <Button 
              bsStyle='warning'
              onClick={()=>{
                handleOnChange(formName, '');
                history.push('/resetaccount')
              }}>
              I don't know how to get this. Reset my login credentials
            </Button>
          </Col>
        </FormGroup>
      </Form>
    );
  }
}

PasswordForm.propTypes = {
  title: PropTypes.string, 
  placeHolder:PropTypes.string, 
  formName: PropTypes.string, 
  state: PropTypes.obj,
  handleOnChange: PropTypes.func, 
  submitOnClick: PropTypes.func,
  cancelOnClick: PropTypes.func
}

export default withRouter(PasswordForm);