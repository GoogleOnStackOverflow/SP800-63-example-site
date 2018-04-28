import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Panel, Col } from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const ChallengeModal = ({challenge}) => {
  return (
    <Modal show={challenge}>
      <Modal.Header>
        <Modal.Title>Hello, Administrator!</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Welcome. To continue the login process, please use the following token as your crypto-software input to generate a login url.</p>
        <Panel>
          <Panel.Body><Col>{challenge}</Col></Panel.Body>
        </Panel>
      </Modal.Body>
      <Modal.Footer>
        <CopyToClipboard text={challenge}>
          <Button bsStyle='success'>
            Copy to Clipboard
          </Button>
        </CopyToClipboard>
      </Modal.Footer>
    </Modal>
  ); 
}

ChallengeModal.proptypes = {
  challenge: PropTypes.string
}

export default ChallengeModal;