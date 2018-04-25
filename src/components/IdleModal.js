import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';
import { withRouter } from "react-router-dom";
import { hasCurrentUser } from '../firebaseActions'

class IdleModal extends React.Component {
  constructor(props) {
    super(props);
    let startTimer = () => {
      this.setState({time: new Date().getTime() / 1000});
      setTimeout(startTimer, 500);
    }
    this.state={
      time:0
    }

    startTimer();
  }

  componentWillUpdate() {
    if(this.state.time - this.props.idle > 15*60)
      this.props.handleLogout(this.props.history);
  }

  render() {
    let { idle, handleLogout, handleKeepOn, history } = this.props;
    let now = this.state.time
    
    return (
      <Modal show={((now-idle) > 13*60) && hasCurrentUser()} onHide={handleKeepOn}>
        <Modal.Header closeButton>
          <Modal.Title>Are you still here?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>It seems to be more than 13 minutes since last time you operate anything on this site. Do you want to keep signing on?</p>
          <p>You would be automatically signed out if no operation is taken in the next 2 minutes</p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => {handleLogout(history)}}>
            Logout
          </Button>
          <Button 
            bsStyle='success'
            onClick={handleKeepOn}>
            Keep me on
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

IdleModal.proptypes = {
  idle: PropTypes.number,
  handleLogout: PropTypes.func,
  handleKeepOn: PropTypes.func
}

export default withRouter(IdleModal);