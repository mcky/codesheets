export const createReducer = (initialState, handlers) => (
	state = initialState,
	action,
) => (handlers[action.type] ? handlers[action.type](action)(state) : state)
