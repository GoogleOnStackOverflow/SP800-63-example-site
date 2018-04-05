import { HANDLE_VALUE_ONCHANGE } from '../actions';

const userFormStatus = (state = {}, action) => {
  switch (action.type) {
    case HANDLE_VALUE_ONCHANGE:
      console.log(`formname: ${action.formName}, value: ${action.value}`);
      return {
        ...state,
        [action.formName]: action.value
      }
    default:
      return state;
  }
}

export default userFormStatus;