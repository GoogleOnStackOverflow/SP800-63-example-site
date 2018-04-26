import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from "react-router-dom"
import { Form, FormGroup, FormControl, Button } from 'react-bootstrap'
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

  componentWillMount() {
    if(hasCurrentUser()) logout();
  }

  render() {
    let {handleOnChange, nextOnClick, state, history} = this.props;
    return (
      <div align='middle'>
        <h4>Login</h4>
        <Form inline onSubmit={(e) => {
          e.preventDefault();
          nextOnClick(state[FORM_USR], history)
        }}>
          <FormGroup controlId="formHorizontalEmail">
            <FormControl autoFocus
              type='email' 
              placeholder='Email'
              onChange = {(e) => {
                handleOnChange(FORM_USR, e.target.value);
              }}
              value={state[FORM_USR]}
            />
          </FormGroup>{' '}
          <FormGroup controlId="nextButton">
            <Button
              bsStyle='success' 
              onClick={()=>{nextOnClick(state[FORM_USR], history)}}
              disabled={!isEmail(state[FORM_USR])}>
              Next
            </Button>
          </FormGroup>
        </Form>
      </div>
    );
  }
}

LoginForm.propTypes = {
  state: PropTypes.obj,
  handleOnChange: PropTypes.func,
  nextOnClick: PropTypes.func
}

export const LoginFormWithRouter = withRouter(LoginForm);