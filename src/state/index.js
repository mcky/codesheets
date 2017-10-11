import { combineReducers, createStore } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'

import cells from './cells'

const rootReducer = combineReducers({
	cells,
})

const middleware = composeWithDevTools()

const store = createStore(rootReducer, middleware)

export default store
