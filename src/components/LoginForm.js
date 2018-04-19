import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from "react-router-dom"
import { Form, FormGroup, FormControl, Button, ControlLabel ,Col } from 'react-bootstrap'
import { hasCurrentUser, logout } from '../firebaseActions'

export const FORM_USR = 'FORM_USR';

export const isEmail = (text) => {
  if(!text) return false;
  var p = text.indexOf('@');
  return (p!==-1 && p!==0 && p!==(text.length-1));
}


class LoginForm extends React.Component {
  constructor(props){
    super(props); 
    if(hasCurrentUser()) logout();
  }

  componentDidMount() {
    if(hasCurrentUser()) logout();
  }

  render() {
    let {handleOnChange, state, history} = this.props;
    return (
      <Form horizontal>
        <FormGroup controlId="title">
          <h4 align='middle'>Login</h4>
        </FormGroup>
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
            value={state[FORM_USR]}
          />
        </Col>
        </FormGroup>

      <FormGroup>
        <Col smOffset={2} sm={10}>
          <Button 
            onClick={()=>{history.push('/registerpwd')}}
            disabled={!isEmail(state[FORM_USR])}>
            Sign on
          </Button>
          <Button 
            onClick={()=>{history.push('/loginpwd')}}
            disabled={!isEmail(state[FORM_USR])}>
            Login
          </Button>
        </Col>
      </FormGroup>
    </Form>
    );
  }
}

LoginForm.propTypes = {
  state: PropTypes.obj,
  handleOnChange: PropTypes.func,
}

export const LoginFormWithRouter = withRouter(LoginForm);