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

const computable = (dependencies, formula) => ({
	computable: true,
	dependencies,
	formula: R.memoize((...args) => Promise.resolve(formula(...args))),
})

const constant = val => ({
	constant: true,
	value: val,
})

const sheet = {
	A1: constant(50),
	A2: computable([], () =>
		fetch('https://api.punkapi.com/v2/beers/random')
			.then(res => res.json())
			.then(R.head)
			.then(R.prop('name')),
	),
	A4: constant(30),
	B1: constant(7),
	C1: computable(['E1', 'B1'], (E1, B1) => {
		return `E1: ${E1}, B1: ${B1}!`
	}),
	D1: constant(3),
	E1: computable(['A1'], A1 => {
		return A1 + 5
	}),
	F1: constant(12),
	H1: computable(['B1'], B1 => {
		return delay(4000).then(() => B1 * 10)
	}),
	G7: computable(['A1', 'A4'], (A1, A4) => {
		return A1 * A4
	}),
	H2: computable(['H1'], H1 => {
		return `Waiting for H1.. ${H1 * 2}`
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
})

const $constantValues = most
	.from($changes)
	.filter(([ref, cell]) => cell.constant)
	.map(([ref, cell]) => [ref, cell.value])

const $formulaValues = most
	.from($changes)
	.filter(([ref, cell]) => cell.computable)
	.map(([ref, cell]) => {
		yellow('v', ref, cell)

		const $deps = cell.dependencies.map(dep => {
			return most
				.from($changes)
				.filter(([depRef]) => depRef === dep)
				.skipRepeatsWith(
					(prev, next) => prev[1].value === next[1].value,
				)
		})

		return most
			.mergeArray($deps)
			.scan((values, [ref, cell]) => R.assoc(ref, cell, values), {})
			.filter(hasProps(cell.dependencies))
			.map(values => {
				// @TODO: How will this work with formulas referencing formulas?
				const data = R.pipe(
					R.props(cell.dependencies),
					R.map(R.prop('value')),
				)(values)

				console.log('data', data)

				return R.apply(cell.formula, data)
			})
			.flatMap(p => most.fromPromise(p))
			.map(endVal => {
				return [ref, endVal]
			})
	})
	.join()

$constantValues.observe(x => {
	console.log('$c', x)
})

$formulaValues.observe(x => {
	console.log('$f', x)
})

const $sheet = most
	.mergeArray([$constantValues, $formulaValues])
	.scan((values, [ref, cell]) => R.assoc(ref, cell, values), {})

most.from($changes).observe(c => {
	blue('$change', c)
})

$sheet.observe(x => {
	red('$', x)
})

setTimeout(() => {
	change(['A1', constant(10)])
}, 500)

setTimeout(() => {
	// Currently dropping the A1 before
	// as it isn't listening yet
	change(['C1', computable(['A1', 'B1'], (A1, B1) => A1 + B1)])
}, 1000)

setTimeout(() => {
	change(['A1', constant(20)])
}, 1500)

setTimeout(() => {
	change(['B1', constant(10)])
}, 2000)
