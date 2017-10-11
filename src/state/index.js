import { combineReducers, createStore } from 'redux'
import {
	combineEpics,
	createEpicMiddleware,
	createStateStreamEnhancer,
} from 'redux-most'
import { composeWithDevTools } from 'redux-devtools-extension'

import cells, {
	startEpic,
	constantValueEpic,
	formulaChangeEpic,
	formulaValueEpic,
} from './cells'

const rootReducer = combineReducers({
	cells,
})

const rootEpic = combineEpics([
	startEpic,
	constantValueEpic,
	formulaChangeEpic,
	formulaValueEpic,
])

const epicMiddleware = createEpicMiddleware(rootEpic)

const middleware = composeWithDevTools(
	createStateStreamEnhancer(epicMiddleware),
)

const store = createStore(rootReducer, middleware)

export default store
