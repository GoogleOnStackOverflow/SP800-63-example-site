import { combineReducers } from 'redux'
import show from './show'
import forms from './forms'
 
const app = combineReducers({
  show,
  forms
})
 
export default app