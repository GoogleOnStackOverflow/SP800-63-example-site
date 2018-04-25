import { combineReducers } from 'redux'
import show from './show'
import forms from './forms'
import idle from './idle'
 
const app = combineReducers({
  show,
  forms,
  idle
})

export default app