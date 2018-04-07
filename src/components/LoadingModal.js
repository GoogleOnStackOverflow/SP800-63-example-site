import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';

const LoadingModal = ({isShow}) => {
  return (
    <Modal show={isShow}>
      <Modal.Header closeButton>
        <Modal.Title>Loading</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Please Wait</p>
      </Modal.Body>
    </Modal>
  );
}

LoadingModal.proptypes = {
  isShow: PropTypes.bool
}

export default LoadingModal;