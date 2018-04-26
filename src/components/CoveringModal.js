import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';

const CoveringModal = ({isShow, title, content}) => {
  return (
    <Modal show={isShow}>
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{content}</p>
      </Modal.Body>
    </Modal>
  );
}

CoveringModal.proptypes = {
  isShow: PropTypes.bool,
  title: PropTypes.string,
  content: PropTypes.string
}

export default CoveringModal;