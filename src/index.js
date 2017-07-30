import React from 'react'
import ReactDOM from 'react-dom'
import R from 'ramda'
import * as most from 'most'
import { create } from '@most/create'

import SpreadsheetContainer from './containers/SpreadsheetContainer'

import './index.css'

const hasProps = R.curry((props, obj) => props.every(prop => obj[prop]))

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

const $changes = create((add, end, error) => {
	window.change = change = add
	return () => console.log('dispose changes')
}).merge(most.from(R.toPairs(sheet)))

const hasRefWithValue = ref => R.where({ 0: R.equals(ref), 1: R.has('value') })
const scanPairs = (values, [ref, cell]) => R.assoc(ref, cell, values)

const $constantValues = most
	.from($changes)
	.filter(([ref, cell]) => cell.isConstant)
	.map(([ref, cell]) => [ref, cell.value])

const $formulaValues = most
	.from($changes)
	.filter(([ref, cell]) => cell.isFormula)
	.map(([ref, cell]) => {
		const $dependencies = cell.dependencies.map(dep =>
			most
				.from($changes)
				.filter(hasRefWithValue(dep))
				.skipRepeatsWith(R.equals),
		)

		return most
			.mergeArray($dependencies)
			.scan(scanPairs, {})
			.filter(hasProps(cell.dependencies))
			.map(values => {
				const data = R.pipe(
					R.props(cell.dependencies),
					R.map(R.prop('value')),
				)(values)

				return R.apply(cell.formula, data)
			})
			.flatMap(p => most.fromPromise(p))
			.map(value => [ref, value])
	})
	.join()

$formulaValues.observe(([ref, value]) => {
	change([ref, constant(value)])
})

const getCellList = (rows, columns) =>
	R.range(0, rows).map(R.always(R.range(0, columns).map(R.always(null))))

const INITIAL_CELLS = getCellList(10, 10)

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const cellIndexFromRef = R.pipe(
	R.toUpper,
	R.split(''),
	R.map(cell => (isNaN(Number(cell)) ? cell : Number(cell))),
	R.partition(R.is(Number)),
	([numbers, letters]) => {
		const x = letters
			.map((l, i) => R.indexOf(l, alphabet) + i * 26)
			.reduce(R.add)
		const y = Number(numbers.join('')) - 1
		return [y, x]
	},
)

const $sheet = most
	.mergeArray([$constantValues, $formulaValues])
	.scan((matrix, [ref, value]) => {
		const [y, x] = cellIndexFromRef(ref)
		return R.assocPath([y, x], value, matrix)
	}, INITIAL_CELLS)

const Spreadsheet = SpreadsheetContainer($sheet)

const App = () => <Spreadsheet />

ReactDOM.render(<App />, document.getElementById('root'))
