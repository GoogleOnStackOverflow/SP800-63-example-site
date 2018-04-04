import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { Route } from 'react-router'
import { BrowserRouter } from 'react-router-dom'
import loginStore from './reducers'
import App from './App'
import registerServiceWorker from './registerServiceWorker'
import { PWD_TOKEN_NAME, OTP_TOKEN_NAME, getCookie } from './cookiesHelper'
import Login from './containers/Login'

let store = createStore(loginStore);

const pwToken = () => {
  return getCookie(PWD_TOKEN_NAME) === "" ? true : false;
}

const otpToken = () => {
  return getCookie(OTP_TOKEN_NAME) === "" ? true : false;
}

const requireAuth = (nextState, replace) => {
  if (!otpToken() && !pwToken()) {
    replace({
      pathname: '/login'
    })
  } else if (!otpToken()) {
    replace({
      pathname: '/otp'
    })
  }
}

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <div>
        <Route path="/" component={App} />
        <Route path="/login" component={Login} />
      {
        //<Route path="/otp" component={OtpLogin} />
        //<Route path="/service" component={Checkout} onEnter={requireAuth} />
      }
      </div>
    </BrowserRouter>
  </Provider>, 
  document.getElementById('root'));
registerServiceWorker();
