import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { Route } from 'react-router'
import { BrowserRouter } from 'react-router-dom'
import loginStore from './reducers'
import App from './App'
import registerServiceWorker from './registerServiceWorker'
import Login from './containers/Login'
import LoginPasswordForm from './containers/LoginPasswordForm'
import LoginOTPForm from './containers/LoginOTPForm'
import RegisterFormPwd from './containers/RegisterFormPwd'
import VerifyEmailPage from './containers/VerifyEmailPage'
import EvidenceResForm from './containers/EvidenceResForm'

let store = createStore(loginStore);

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <div>
        <Route path="/" component={App} />
        <Route path="/login" component={Login} />
        <Route path="/loginpwd" component={LoginPasswordForm} />
        <Route path="/loginotp" component={LoginOTPForm} />
        <Route path="/registerpwd" component={RegisterFormPwd} />
        <Route path="/verifymail" component={VerifyEmailPage} />
        <Route path="/evidenceres" component={EvidenceResForm} />
        <Route path="/evidencewait" component={Login} />
      {
        //<Route path="/service" component={Checkout} onEnter={requireAuth} />
      }
      </div>
    </BrowserRouter>
  </Provider>, 
  document.getElementById('root'));
registerServiceWorker();
