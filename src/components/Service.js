import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from "react-router-dom";
import { Form, FormGroup, FormControl, Button, ControlLabel , Col, HelpBlock } from 'react-bootstrap';
import CheckModal from '../containers/CheckModal'
import ReLoginModal from '../containers/ReLoginModal'
import { hasCurrentUser, getUserPII } from '../firebaseActions'
import { userDataFormNames } from './RegisterPIIForm'

const FormGroupComponent = ({state, Name, FormName, discrebtion}) => {
  return (
    <FormGroup 
      controlId={Name}>
      <Col componentClass={ControlLabel} sm={2}>        
        <p>{Name}</p>
      </Col>
      <Col sm={10}>
        <FormControl 
          type='text'
          value={state[FormName]}
        />
        <HelpBlock>{discrebtion}</HelpBlock>
      </Col>
    </FormGroup>
  );
}

class Service extends React.Component {
  constructor(props){
    super(props);
    
    if(!hasCurrentUser()) this.props.history.push('/login');
    this.props.dispatchLoading();
    getUserPII().then((data)=> {
      this.props.dispatchNotLoading();
      Object.keys(data).forEach(dataName => {
        this.props.handleOnChange(userDataFormNames[dataName], data[dataName]);
      })
    }, err => {
      this.props.dispatchNotLoading();
      this.props.dispatchErrMsg(`${err.message}. Sorry for the error. Please login again to resolve this.`, '/login');
    })
  }

  componentDidMount() {
  }

  render() {
    let { state, changePwdOnClick, changeOTPOnClick, changePhoneNumOnClick, handleRemove, removeAccountOnClick } = this.props;
    return (
      <div>
        <ReLoginModal/>
        <CheckModal cancelOnClick={()=>{}} okOnClick={handleRemove} />
        <h4>Profile</h4>
        <Form>
          <FormGroupComponent
            state = {state}
            Name = 'First Name'
            FormName = {userDataFormNames['FirstName']}
            discrebtion = '名'
          />
          <FormGroupComponent
            state = {state}
            Name = 'First Name'
            FormName = {userDataFormNames['LastName']}
            discrebtion = '姓'
          />
          <FormGroupComponent
            state = {state}
            Name = 'ROC ID'
            FormName = {userDataFormNames['ID']}
            discrebtion = '身分證字號 (You cannot edit this)'
          />
          <FormGroupComponent
            state = {state}
            Name = 'Birthday'
            FormName = {userDataFormNames['Birthday']}
            discrebtion = 'yyyymmdd (You cannot edit this)'
          />
          <FormGroupComponent
            state = {state}
            Name = 'Phone'
            FormName = {userDataFormNames['Phone']}
            discrebtion = 'If you want to change the phone number, please click on the button below'
          />

          <FormGroup >
            <Col smOffset={2} sm={10}>
              <Button 
                bsStyle='warning'
                onClick={()=>{(changePwdOnClick())}}>
                Change password
              </Button>
              <Button 
                bsStyle='warning'
                onClick={()=>{(changeOTPOnClick())}}>
                Reset my OTP key
              </Button>
              <Button 
                bsStyle='warning'
                onClick={()=>{(changePhoneNumOnClick())}}>
                Edit my phone number
              </Button>
            </Col>
            <Col smOffset={2} sm={10}>
              <Button 
                bsStyle='danger'
                onClick={()=>{removeAccountOnClick()}}>
                Remove my account and all personal data
              </Button>
            </Col>
          </FormGroup>
        </Form>
      </div>
    );
  }
}

Service.propTypes = {
  state: PropTypes.obj,
  handleOnChange: PropTypes.func, 
  changePwdOnClick: PropTypes.func,
  changeOTPOnClick: PropTypes.func, 
  changePhoneNumOnClick: PropTypes.func,
  handleRemove: PropTypes.func,
  removeAccountOnClick: PropTypes.func,
  dispatchLoading: PropTypes.func,
  dispatchNotLoading: PropTypes.func,
  dispatchErrMsg: PropTypes.func
}

export default withRouter(Service);