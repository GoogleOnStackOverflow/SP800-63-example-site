import React from 'react'
import PropTypes from 'prop-types'
import { Image, Table, Button } from 'react-bootstrap'
import { currentUserAdmin, getAllNotVerifiedUsers } from '../firebaseActions'

class ManagerForm extends React.Component {
  constructor(props){
    super(props); 
    
    this.props.dispatchLoading();
    currentUserAdmin().then(() => {
      getAllNotVerifiedUsers().then(result => {
        console.log(result);
        this.props.dispatchNotLoading();
        this.props.handleOnChange('ADMIN_PII_DATA', result);
      }).catch(err => {
        this.props.dispatchNotLoading();
        this.props.dispatchErrMsg('Something is wrong. Try again later or contact the developer. See the console panel for more information.', '/login');
      })
    }, err => {
      this.props.dispatchNotLoading();
      this.props.dispatchErrMsg('Permission Denied. Login again using your admin account.', '/login');
    })
  }

  render() {
    let { userPiisObj, handleVerifyOnClick } = this.props;

    return (
      <div align='middle'>
        <h4>Not verified user list</h4>
        <Table striped bordered condensed hover>
          <thead>
            <tr>
              <th colSpan="3">Evidences</th>
              <th>Last Name</th>
              <th>First Name</th>
              <th>ROC ID</th>
              <th>Birthday</th>
              <th>Operations</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(userPiisObj).map(emailId => {
              let pii = userPiisObj[emailId];
              return (
                <tr key={emailId} show={!pii.verified}>
                  <td><Image responsive src={pii.e1}/></td>
                  <td><Image responsive src={pii.e2}/></td>
                  <td><Image responsive src={pii.e3}/></td>
                  <td>{pii.LastName}</td>
                  <td>{pii.FirstName}</td>
                  <td>{pii.ID}</td>
                  <td>{pii.Birthday}</td>
                  <td>
                    <Button
                      bsStyle='success'
                      onClick={()=> {handleVerifyOnClick(emailId, userPiisObj)}}>
                      Verify
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </div>
    );
  }
}

ManagerForm.propTypes = {
  userPiisObj: PropTypes.obj,
  handleVerifyOnClick: PropTypes.func,
  dispatchLoading: PropTypes.func,
  dispatchNotLoading: PropTypes.func,
  dispatchErrMsg: PropTypes.func
}

export default ManagerForm;