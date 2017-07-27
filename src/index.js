import R from 'ramda'
import * as most from 'most'
import { create } from '@most/create'
import util from 'util'

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

const getCellList = (rows, columns) => {
	const alphabet = R.pipe(R.split(''), R.take(rows))(
		' ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	)
	const numbers = R.range(0, rows + 1)
	return numbers.map(n => alphabet.map(l => `${l}${n}`))
}

const renderTable = (cells, values) => {
	document.body.innerHTML = `
	<table>
	  ${cells
			.map((row, i) => `<tr>
	  		${row
				.map((cell, j) => {
					const value = values[cell] || ''
					const valueOrHeader = i === 0 ? R.dropLast(1, cell) : j === 0 ? R.drop(1, cell) : value
					const color = i === 0 || j === 0 ? '#CCC' : sheet[cell] ? '#fffcdb' : 'none'
					return [cell, valueOrHeader, color]
				})
				.map(([cell, value, color]) => `<td data-cell="${cell}" style="background: ${color}">${value}</td>`)
				.join('')}
	  </tr>`)
			.join('')}
	</table>
	`
}

const colors = ['#6ea5fd', '#fd6e6e', '#fffcdb', '#b1eca4']
const [blue, red, yellow, green] = colors.map(color => (name, ...msg) =>
	console.log(
		`%c ${name} ${util.inspect(msg, { depth: Infinity })}`,
		`background: ${color}; padding: 4px; line-height: 1.3em;`,
	))

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

const $sheet = most
	.mergeArray([$constantValues, $formulaValues])
	.scan(scanPairs, {})

most.from($changes).observe(c => {
	blue('$change', c)
})

$sheet.observe(values => {
	red('$p', values)
	renderTable(getCellList(10, 10), values)
})
