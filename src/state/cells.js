import {
	pipe,
	toPairs,
	map,
	append,
	prop,
	props,
	isEmpty,
	all,
	has,
	pluck,
	equals,
	apply,
	assocPath,
	assoc,
} from 'ramda'
import { createAction } from 'redux-actions'
import { select } from 'redux-most'
import { merge, just, from, fromPromise } from 'most'
import { createReducer } from './utils'
import { hasProps, createSheet } from '../utils'

import initialSheet from '../example-sheet'

export const CELL_CHANGED = 'CELL_CHANGED'
export const CONSTANT_CHANGED = 'CONSTANT_CHANGED'
export const FORMULA_CHANGED = 'FORMULA_CHANGED'

export const FORMULA_VALUE_CHANGED = 'FORMULA_VALUE_CHANGED'
export const CONSTANT_VALUE_CHANGED = 'CONSTANT_VALUE_CHANGED'

export const cellChanged = createAction(CELL_CHANGED)
export const constantChanged = createAction(CONSTANT_CHANGED)
export const formulaChanged = createAction(FORMULA_CHANGED)

export const constantValueChanged = createAction(CONSTANT_VALUE_CHANGED)
export const formulaValueChanged = createAction(FORMULA_VALUE_CHANGED)

const startTime = Date.now()
const formatInitialSheet = pipe(toPairs, map(append(startTime)))
const initialCell$ = from(formatInitialSheet(initialSheet))

export const startEpic = action$ =>
	action$
		.thru(select('@@redux-most/EPIC_BEGIN'))
		.skip(1)
		.merge(initialCell$)
		.map(cellChanged)

const getPayload = prop('payload')

export const constantValueEpic = action$ =>
	action$
		.thru(select(CELL_CHANGED))
		.map(getPayload)
		.filter(([, cell]) => cell.isConstant)
		.chain(cell =>
			merge(
				just(constantChanged(cell)),
				just(constantValueChanged([cell[0], cell[1].value])),
			),
		)

export const formulaChangeEpic = action$ =>
	action$
		.thru(select(CELL_CHANGED))
		.map(getPayload)
		.filter(([, cell]) => cell.isFormula)
		.map(formulaChanged)

export const formulaValueEpic = (action$, state$) => {
	const formulaChange$ = action$.thru(select(FORMULA_CHANGED)).map(getPayload)

	const formulaValue$ = from(formulaChange$)
		.map(([ref, cell, updatedAt]) => {
			const updatedFormula$ = from(formulaChange$)
				.filter(([changedFormulaRef]) => changedFormulaRef === ref)
				.filter(([, , lastUpdatedAt]) => lastUpdatedAt !== updatedAt)

			if (isEmpty(cell.dependencies)) {
				return fromPromise(cell.formula())
					.until(updatedFormula$)
					.map(value => [ref, value])
			}

			const accumulatedValue$ = state$.map(prop('cells'))

			return from(accumulatedValue$)
				.until(updatedFormula$)
				.filter(hasProps(cell.dependencies))
				.map(props(cell.dependencies))
				.filter(all(has('computedValue')))
				.map(pluck('computedValue'))
				.skipRepeatsWith(equals)
				.map(apply(cell.formula))
				.flatMap(p => fromPromise(p))
				.map(value => [ref, value])
		})
		.join()

	return formulaValue$.map(formulaValueChanged)
}

const setComputedValue = ({ payload }) => {
	const [ref, value] = payload
	return assocPath([ref, 'computedValue'], value)
}

const emptyCells = createSheet(10, 10, { value: '' })

const reducer = createReducer(emptyCells, {
	CELL_CHANGED: ({ payload }) => state => {
		const [ref, cell] = payload
		return assoc(ref, cell, state)
	},
	FORMULA_VALUE_CHANGED: setComputedValue,
	CONSTANT_VALUE_CHANGED: setComputedValue,
})

export default reducer
