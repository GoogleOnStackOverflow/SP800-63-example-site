const idle = (state = {}, action) => {
  return (new Date().getTime())/1000;
}

export default idle;