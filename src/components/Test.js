import React from 'react'
import { withRouter } from "react-router-dom"

class Test extends React.Component {
  constructor(props){
    super(props);
    console.log(this.props.location);
    console.log(this.props.location.href);
  }

  render() {
    return <div/>;
  }
}

export default withRouter(Test)