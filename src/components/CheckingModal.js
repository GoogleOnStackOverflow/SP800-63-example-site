import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';
import { withRouter } from "react-router-dom";

const CheckingModal = ({title, msg, cancelOnClick, onCancelNav, okOnClick, onOkNav, handleClose, history}) => {
  return (
    <Modal show={msg===undefined?false:true} onHide={()=> {
      if(onCancelNav)
      history.push(onCancelNav);
      cancelOnClick();
      handleClose();}}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{msg}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => {
          if(onCancelNav)
            history.push(onCancelNav);
          cancelOnClick();
          handleClose();
        }}>
        Cancel
        </Button>
        <Button 
          bsStyle='primary'
          onClick={() => {
          if(onOkNav)
            history.push(onOkNav);
          okOnClick();
          handleClose();
        }}>
        Yes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

CheckingModal.proptypes = {
  msg: PropTypes.string,
  cancelOnClick: PropTypes.func,
  onCancelNav: PropTypes.string,
  okOnClick: PropTypes.func,
  onOkNav: PropTypes.string,
  handleClose: PropTypes.func
}

export default withRouter(CheckingModal);