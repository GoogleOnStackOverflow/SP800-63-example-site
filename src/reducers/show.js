import { LOADING, NOT_LOADING } from '../actions';

const show = (state = {}, action) => {
  switch (action.type) {
    case LOADING:
      return {
        ...state,
        loading: true
      }
    case NOT_LOADING:
      return {
        ...state,
        loading: false
      }
    default:
      return state;
  }
}

export default show;