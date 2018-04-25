import { HANDLE_VALUE_ONCHANGE, CLEAR_ALL_VALUE } from '../actions';

const userFormStatus = (state = {}, action) => {
  switch (action.type) {
    case HANDLE_VALUE_ONCHANGE:
      return {
        ...state,
        [action.formName]: action.value
      }
    case CLEAR_ALL_VALUE:
    	return {}
    default:
      return state;
  }
}

export default userFormStatus;