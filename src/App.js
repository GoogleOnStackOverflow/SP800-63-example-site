import React, { Component } from 'react';
import { Nav, Navbar, NavItem, NavDropdown, MenuItem } from 'react-bootstrap'
import AlertModalContainer from './containers/AlertModalContainer'

const loginOnClick = () => {
  return "/login";
}

class App extends Component {
  render() {
    return (
      <Navbar>
        <AlertModalContainer/>
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
          <NavItem eventKey={1} href="#">
            {this.props.isLogin? "Logout" : "Login"}
          </NavItem>
        </Nav>
      </Navbar>
    );
  }
}

export default App;
