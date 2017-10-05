import React from 'react'
import ReactDOM from 'react-dom'
import R from 'ramda'
import * as most from 'most'
import { create } from '@most/create'
import { hold } from '@most/hold'

import { hasProps, scanPairs, getCellList, cellIndexFromRef } from './utils'
import SpreadsheetContainer from './containers/SpreadsheetContainer'

import exampleSheet from './example-sheet'

import './index.css'

let change = (...args) => {
	console.error('event missed:', args)
}

const change$ = create(add => {
	change = add

	const startTime = Date.now()

	R.pipe(
		R.toPairs,
		R.map(R.append(startTime)),
		R.forEach(pair => {
			change(pair)
		}),
	)(exampleSheet)

	return () => {}
})

const constantValue$ = most
	.from(change$)
	.filter(([, cell]) => cell.isConstant)
	.map(([ref, cell]) => [ref, cell.value, cell])

const formulaChange$ = most.from(change$).filter(([, cell]) => cell.isFormula)

const accumulatedValue$ = hold(most.from(constantValue$).scan(scanPairs, {}))
accumulatedValue$.drain()

const formulaValue$ = most
	.from(formulaChange$)
	.map(([ref, cell, updatedAt]) => {
		const updatedFormula$ = most
			.from(formulaChange$)
			.filter(([changedFormulaRef]) => changedFormulaRef === ref)
			.filter(([, , lastUpdatedAt]) => lastUpdatedAt !== updatedAt)

		if (R.isEmpty(cell.dependencies)) {
			return most
				.fromPromise(cell.formula())
				.until(updatedFormula$)
				.map(value => [ref, value])
		}

		return most
			.from(accumulatedValue$)
			.until(updatedFormula$)
			.filter(hasProps(cell.dependencies))
			.map(R.props(cell.dependencies))
			.skipRepeatsWith(R.equals)
			.map(R.apply(cell.formula))
			.flatMap(p => most.fromPromise(p))
			.map(value => [ref, value, cell])
	})
	.join()

const EMPTY_CELL = { value: null, width: 35, className: 'SpreadsheetCell' }
const INITIAL_CELLS = getCellList(10, 10, EMPTY_CELL)

const value$ = most
	.mergeArray([constantValue$, formulaValue$])
	.scan((matrix, [ref, value, originalCell]) => {
		const [y, x] = cellIndexFromRef(ref)

		return R.over(
			R.lensPath([y, x]),
			R.pipe(R.mergeDeepRight(originalCell), R.assoc('value', value)),
			matrix,
		)
	}, INITIAL_CELLS)

const Spreadsheet = SpreadsheetContainer(value$)

const App = () => <Spreadsheet />

ReactDOM.render(<App />, document.getElementById('root'))
