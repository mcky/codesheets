import React from 'react'
import ReactDOM from 'react-dom'
import R from 'ramda'
import * as most from 'most'
import { create } from '@most/create'
import { hold } from '@most/hold'

import {
	hasProps,
	hasRefWithValue,
	scanPairs,
	getCellList,
	cellIndexFromRef,
} from './utils'

import SpreadsheetContainer from './containers/SpreadsheetContainer'

import './index.css'

const delay = ms =>
	new Promise(resolve => {
		setTimeout(resolve, ms)
	})

const formula = (dependencies, formula) => ({
	isFormula: true,
	dependencies,
	formula: R.memoize((...args) => Promise.resolve(formula(...args))),
})

const constant = val => ({
	isConstant: true,
	value: val,
})

const sheet = {
	A1: constant(50),
	A2: formula([], () =>
		fetch('https://api.punkapi.com/v2/beers/random')
			.then(res => res.json())
			.then(R.head)
			.then(R.prop('name')),
	),
	A3: formula(['A1'], A1 =>
		delay(20).then(() => `computed ${A1} from A1`),
	),
	A4: constant(30),

	A5: formula(['A1', 'A4'], (A1, A3) =>
		delay(3000).then(() => `A1:${A1} - A3:${A3}`),
	),

	A6: formula(['A5'], A5 => delay(20).then(() => `A5: ${A5}`)),

	B1: constant(7),
	C1: formula(['E1', 'B1'], (E1, B1) => {
		return `E1: ${E1}, B1: ${B1}!`
	}),
	D1: constant(3),
	E1: formula(['A1'], A1 => {
		return A1 + 5
	}),
	F1: constant(12),
	H1: formula(['B1'], B1 => {
		return delay(4000).then(() => B1 * 10)
	}),
	G7: formula(['A1', 'A4'], (A1, A4) => {
		return A1 * A4
	}),
	H2: formula(['H1'], H1 => {
		return `H1*2 = ${H1 * 2}`
	}),
}

let change = (...args) => {
	console.log('event missed:', args)
}

const change$ = create((add, end, error) => {
	window.change = change = add

	const startTime = Date.now()

	R.pipe(
		R.toPairs,
		R.map(R.append(startTime)),
		R.forEach(pair => {
			change(pair)
		}),
	)(sheet)

	return () => console.log('dispose changes')
})

const constantValue$ = most
	.from(change$)
	.filter(([ref, cell]) => cell.isConstant)
	.map(([ref, cell]) => [ref, cell.value])

const formulaChange$ = most
	.from(change$)
	.filter(([ref, cell]) => cell.isFormula)

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
			.map(value => [ref, value])
	})
	.join()


const EMPTY_CELL = { value: null, width: 35, className: 'SpreadsheetCell' }
const INITIAL_CELLS = getCellList(10, 10, EMPTY_CELL)

const value$ = most
	.mergeArray([constantValue$, formulaValue$])
	.scan((matrix, [ref, value]) => {
		const [y, x] = cellIndexFromRef(ref)
		return R.assocPath([y, x, 'value'], value, matrix)
	}, INITIAL_CELLS)

const Spreadsheet = SpreadsheetContainer(value$)

const App = () => <Spreadsheet />

ReactDOM.render(<App />, document.getElementById('root'))
