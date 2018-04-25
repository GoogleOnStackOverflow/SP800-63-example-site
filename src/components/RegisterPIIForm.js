import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from "react-router-dom";
import { Form, FormGroup, FormControl, Button, ControlLabel , Col, HelpBlock } from 'react-bootstrap';
import CheckModal from '../containers/CheckModal'
import { hasCurrentUser, currentUserPIISet } from '../firebaseActions'

export const checkID = (ID) => {
  let codes = '0123456789ABCDEFGHJKLMNPQRSTUVXYWZIO'
  let decode = [];
  let checkSum = 0;
  if(!ID)
    return false;
  if (ID.length !== 10)
    return false;
  if(!/^[A-Z][\d]{9}$/.test(ID))
    return false;

  for(var i=0; i<10; i++){
    decode[i] = codes.indexOf(ID[i]);
  }

  if(decode[1] !== 1 && decode[1] !== 2)
    return false;

  checkSum += ((decode[0]-(decode[0]%10))/10) + (decode[0]%10)*9;
  for(i=1; i<10; i++) {
    checkSum += decode[i]*((9-i)>0? 9-i : 1);
  }

  return checkSum % 10 === 0;
}

export const checkPhone = (num) => {
  if(!/^[0-9]{10}$/.test(num))
    return false;
  return num.indexOf('09') === 0;
}

export const checkBirthDay = (day) => {
  let now = new Date();
  let nowYear = now.getFullYear();
  let daysInMounth = [undefined, 31, undefined, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  if(day.length !== 8)
    return false;
  if(!/^[\d]{8}$/.test(day))
    return false;
  let y = parseInt(day.substring(0,4), 10);
  let m = parseInt(day.substring(4,6), 10);
  let d = parseInt(day.substring(6,8), 10);

  if(y<(nowYear-200) || y>nowYear)
    return false;
  if(m<1 || m>12)
    return false
  if(m !== 2 && d>daysInMounth[m])
    return false;
  if(m === 2)
    if(y%4 === 0) {
      if(y%100 === 0 && y%400 !==0){
        if(d > 28) return false;
      } else if(d>29)
        return false;
    } else if(d > 28)
      return false;

  return true;
}

export const userDataFormNames = {
  FirstName: 'FORM_PII_REG_FNAME',
  LastName: 'FORM_PII_REG_LNAME',
  ID: 'FORM_PII_REG_ID',
  Birthday: 'FORM_PII_REG_BIR',
  Phone: 'FORM_PII_REG_PHONE'
}

const formContent = [
  [userDataFormNames.FirstName,'First Name', 'First Name', '（名）'],
  [userDataFormNames.LastName,'Last Name', 'Last Nmae', '（姓氏）'],
  [userDataFormNames.ID,'National ID of ROC', 'ID', '限用中華民國身分證字號，開頭請大寫', checkID],
  [userDataFormNames.Birthday,'BirthDay', 'YYYYMMDD', 'ex 19930101', checkBirthDay],
  [userDataFormNames.Phone,'Phone Number (Cell Phone with service of ROC)', 'ex. 09xx123456', 'A verification code would be sent later', checkPhone]
];


const userDataFromState = (state) => {
  let obj = {};
  Object.keys(userDataFormNames).forEach(dataName => {
    obj[dataName] = state[userDataFormNames[dataName]];
  })

  return obj;
}

const contentAllFilledAndValidated = (state, formContent) => {
  for(var i=0; i<formContent.length; i++) {
    let contentArr = formContent[i];
    if(!state[contentArr[0]])
      return false;
      
    if(contentArr[4])
      if(!contentArr[4](state[contentArr[0]]))
        return false;
  }

  return true;
}

class RegisterPIIForm extends React.Component {
  constructor(props){
    super(props); 
    if(!hasCurrentUser()) this.props.history.push('/login');

    this.props.dispatchLoading();
    currentUserPIISet().then(result => {
      this.props.dispatchNotLoading();
      if(result && !this.props.disableAutoRedirect)
        this.props.history.push('/verifypii');
    }, err => {
      this.props.dispatchNotLoading();
      this.props.dispatchErrMsg(err);
    });
  }

  render() {
    const {state, handleOnChange, submitOnClick, cancelOnClick, handleRemove, history} = this.props
    
    return (
      <Form horizontal>
        <CheckModal cancelOnClick={()=>{}} okOnClick={()=>{handleRemove(state)}} />
          <h4>Personal information</h4>
          <p>Personal information for the service. All the information would be verified by comparing with the evidences provided earlier</p>
        {formContent.map(contentArr => {
          return (
            <FormGroup 
              validationState={state[contentArr[0]]? (contentArr[4]? (contentArr[4](state[contentArr[0]])? 'success' : 'error') : null) : null}
              controlId={contentArr[0]}>
              <Col componentClass={ControlLabel} sm={2}>        
              <p>{contentArr[1]}</p>
              </Col>
              <Col componentClass={ControlLabel} sm={2}>
              </Col>
              <Col sm={10}>
                <FormControl 
                  type='text'
                  placeholder={contentArr[2]}
                  onChange = {(e) => {
                    handleOnChange(contentArr[0], e.target.value);
                  }}
                  value={state[contentArr[0]]}
                />
                <HelpBlock>{contentArr[3]}</HelpBlock>
              </Col>
            </FormGroup>
          );
        })}
        <FormGroup >
          <Col smOffset={2} sm={10}>
            <Button 
              bsStyle='danger'
              onClick={()=>{cancelOnClick(history)}}>
              Cancel Registration
            </Button>
            <Button 
              disabled={!contentAllFilledAndValidated(state, formContent)}
              onClick={()=>{submitOnClick(state, userDataFromState, history)}}>
              Submit
            </Button>
          </Col>
        </FormGroup>
      </Form>
    );
  }
}

RegisterPIIForm.propTypes = {
  state: PropTypes.obj,
  disableAutoRedirect: PropTypes.bool,
  handleOnChange: PropTypes.func, 
  submitOnClick: PropTypes.func,
  cancelOnClick: PropTypes.func,
  dispatchLoading: PropTypes.func, 
  dispatchNotLoading: PropTypes.func,
  handleRemove: PropTypes.func,
  recapExpired: PropTypes.func,
  recapPassed: PropTypes.func,
  dispatchErrMsg: PropTypes.func
}

export default withRouter(RegisterPIIForm);