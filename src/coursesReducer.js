const coursesReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD':
      return [...action.payload];
    case 'ADD': {
      const id = state.reduce((max, c) => Math.max(max, c.id), 0) + 1;
      return [...state, { ...action.payload, id }];
    }
    case 'REMOVE':
      return state.filter((c) => c.id !== action.payload);
    case 'SET_SCORE': {
      const { id, score } = action.payload;
      return state.map((c) => (c.id === id ? { ...c, score } : c));
    }
    default:
      return state;
  }
};

export default coursesReducer;