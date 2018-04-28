import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from "react-router-dom"

class AdminLogin extends React.Component {
  constructor(props) {
    super(props);
    
    this.props.handleLoginEvent(
      this.props.location.search,
      this.props.history);
  }

  render() {
    return <div/>;
  }
}

AdminLogin.propTypes = {
  handleLoginEvent: PropTypes.func
}

export default withRouter(AdminLogin)