import { createReducer } from './utils'
import { createSheet } from '../utils'

const emptyCells = createSheet(10, 10, { value: '' })

const reducer = createReducer(emptyCells, {})

export default reducer
