import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';
import { withRouter } from "react-router-dom";

const MessageModal = ({title, msg, closeOnClick, onCloseNavPath, history}) => {
  return (
    <Modal show={msg===undefined?false:true} onHide={()=> {
      if(onCloseNavPath)
      history.push(onCloseNavPath);
      closeOnClick()}}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{msg}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => {
          if(onCloseNavPath)
            history.push(onCloseNavPath);
          closeOnClick();
        }}>
        OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

MessageModal.proptypes = {
  msg: PropTypes.string,
  closeOnClick: PropTypes.func,
  onCloseNavPath: PropTypes.string
}

export default withRouter(MessageModal);