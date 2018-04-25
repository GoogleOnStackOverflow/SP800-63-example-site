import React from 'react'
import PropTypes from 'prop-types'
import { Nav, Navbar, NavItem, NavDropdown, MenuItem } from 'react-bootstrap'
import { withRouter } from "react-router-dom"
import AlertModal from '../containers/AlertModal'
import LoadingSpin from '../containers/LoadingSpin'

const AppNavBar = ({isLogin, handleLogOnClick, history, location})=> {
  return (
    <Navbar>
      <AlertModal/>
      <LoadingSpin/>
      <Navbar.Header>
        <Navbar.Brand>
          <a href="/">Example Site</a>
        </Navbar.Brand>
      </Navbar.Header>
      <Nav>
        <NavItem eventKey={1} href="#">
          Info
        </NavItem>
        <NavDropdown eventKey={3} title="Policies" id="basic-nav-dropdown">
          <MenuItem eventKey={3.1}>Privacy Risk Assesment</MenuItem>
          <MenuItem eventKey={3.2}>Practice Statement</MenuItem>
          <MenuItem eventKey={3.3}>Privacy Policy</MenuItem>
          <MenuItem divider />
          <MenuItem eventKey={3.4}>About</MenuItem>
        </NavDropdown>
        </Nav>
        <Nav pullRight>
        <NavItem eventKey={1} onClick={()=>{handleLogOnClick(history)}}>
          {['/login','/loginpwd', '/loginotp'].includes(location.pathname) ? '' : isLogin? "Logout" : "Login"}
        </NavItem>
      </Nav>
    </Navbar>
  );
}

AppNavBar.propTypes = {
  isLogin: PropTypes.bool,
  handleLogOnClick: PropTypes.func
}

export default withRouter(AppNavBar)
