import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from "react-router-dom";
import { Form, FormGroup, FormControl, Button, ControlLabel, HelpBlock, Well, Image } from 'react-bootstrap';
import { hasCurrentUser, currentUserEvidenceUploaded } from '../firebaseActions'

import CheckModal from '../containers/CheckModal'

const FieldGroup = ({ id, label, help, ...props }) => {
  return (
    <FormGroup controlId={id}>
      <ControlLabel>{label}</ControlLabel>
      <FormControl {...props} />
      {help && <HelpBlock>{help}</HelpBlock>}
    </FormGroup>
  );
}

class EvidenceForm extends React.Component {
  constructor(props){
    super(props); 
    
    if(!hasCurrentUser()) this.props.history.push('/login');
    this.props.dispatchLoading();
    currentUserEvidenceUploaded().then(result => {
      this.props.dispatchNotLoading();
      if(result)
        this.props.history.push('/piires');
    }, err => {
      this.props.dispatchNotLoading();
      this.props.dispatchErrMsg(err);
    }) 

    this.state = {
      image: [],
      imagePreview: [] 
    }
  }

  _handleImageOnChange = (e, i) => {
    e.preventDefault();

    let reader = new FileReader();
    let file = e.target.files[0];

    reader.onloadend = () => {
      let nextImage = this.state.image.slice();
      let nextImagePreview = this.state.imagePreview.slice();

      nextImage[i] = file;
      nextImagePreview[i] = reader.result;

      this.setState({
        image: nextImage,
        imagePreview: nextImagePreview
      });
    }

    reader.readAsDataURL(file)
  }

  render() {
    let imageDescribtions = [
      'Front side of your National ID Card of the Republic of China',
      'Back side of your National ID Card of the Republic of China',
      'Front side of your National Health Insurance IC Card or Driver\'s License'
    ];
    let imageTitle = [
      'Evidence #1 (Front Side)',
      'Evidence #1 (Back Side)',
      'Evidence #2 (Front Side)',
    ]
    let {imagePreview, image} = this.state;
    let {handleSubmit, cancelOnClick, handleRemove} = this.props;
    let $imagePreviewBlock = [];
    for(var i=0; i<3; i++) {
      if (imagePreview[i]) {
        $imagePreviewBlock[i] = (<Image src={imagePreview[i]} responsive/>);
      } else {
        $imagePreviewBlock[i] = (<p>Image Preview</p>);
      }
    }

    return (
      <Form>
        <CheckModal cancelOnClick={()=>{}} okOnClick={handleRemove} />
        <FormGroup controlId="formHorizontalPassword">
          <h4>Evidence Resolution</h4>
          {imageDescribtions.map((describtion, index) => {
            return (
              <div>
                  <FieldGroup
                    id={`formControlsFile${index}`}
                    type="file"
                    label={imageTitle[index]}
                    onChange={(e)=>this._handleImageOnChange(e,index)}
                    help={describtion}
                  />
                  <Well bsSize="large">
                    {$imagePreviewBlock[index]}
                  </Well>
              </div>
            )
          })}
        </FormGroup>
        <Button 
          bsStyle='danger'
          onClick={cancelOnClick}>
          Cancel Registration
        </Button>
        <Button type='submit' 
          onClick={(e)=>{
            e.preventDefault();
            handleSubmit(image);
          }}>
          Upload Images
        </Button>
      </Form>
    );
  }
}

EvidenceForm.propTypes = {
  handleSubmit: PropTypes.func,
  cancelOnClick: PropTypes.func,
  handleRemove: PropTypes.func,
  dispatchLoading: PropTypes.func,
  dispatchNotLoading: PropTypes.func,
  dispatchErrMsg: PropTypes.func
}

export default withRouter(EvidenceForm);