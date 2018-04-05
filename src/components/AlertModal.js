import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';

const AlertModal = ({msg, closeOnClick}) => {
  return (
    <Modal show={msg===undefined?false:true} onHide={closeOnClick}>
      <Modal.Header closeButton>
        <Modal.Title>Error</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{msg}</p>
      </Modal.Body>
      <Modal.Footer>
          <Button onClick={closeOnClick}>OK</Button>
      </Modal.Footer>
    </Modal>
  );
}

AlertModal.proptypes = {
  msg: PropTypes.string,
  closeOnClick: PropTypes.func
}

export default AlertModal;