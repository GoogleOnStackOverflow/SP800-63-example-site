import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from "react-router-dom";
import { Form, FormGroup, FormControl, Button } from 'react-bootstrap';
import { FORM_USR, isEmail } from './LoginForm'

import ChallengeModal from './ChallengeModal'

class PasswordForm extends React.Component {
  constructor(props){
    super(props); 
    if(!isEmail(this.props.state[FORM_USR])) this.props.history.push('/login');
  }

  render() {
    const {placeHolder, formName, state, handleOnChange, submitOnClick, cancelOnClick, history, challenge} = this.props
    return (
      <div align='middle'>
        <ChallengeModal challenge={challenge}/>
        <h4>{`Login (${placeHolder})`}</h4>
        <Form inline onSubmit={(e) => {
          e.preventDefault();
          if(state[formName])
            submitOnClick(state, history);
        }}>
          <FormGroup controlId="formHorizontalPassword">    
            <FormControl autoFocus
              type="password" 
              placeholder= {placeHolder}
              onChange = {(e) => {
                handleOnChange(formName, e.target.value);
              }}
            />
          </FormGroup>{' '}
          <FormGroup>
            <Button 
              onClick={()=>{cancelOnClick(history)}}>
              Cancel
            </Button>
          </FormGroup>{' '}
          <FormGroup>
            <Button 
              bsStyle='success'
              disabled={!state[formName]}
              onClick={()=>{submitOnClick(state, history)}}>
              Next
            </Button>
          </FormGroup>
        </Form>
        <p/>
        <p>
          <Button 
            bsSize="small"
            bsStyle='warning'
            onClick={()=>{
              handleOnChange(formName, '');
              history.push('/resetaccount')
            }}>
            I don't know how to get this. Reset my login credentials
          </Button>
        </p>
      </div>
    );
  }
}

PasswordForm.propTypes = {
  placeHolder:PropTypes.string, 
  formName: PropTypes.string,
  challenge: PropTypes.string,
  state: PropTypes.obj,
  handleOnChange: PropTypes.func, 
  submitOnClick: PropTypes.func,
  cancelOnClick: PropTypes.func
}

export default withRouter(PasswordForm);