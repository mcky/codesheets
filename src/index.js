import R from 'ramda'
import * as most from 'most'
import { create } from '@most/create'

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
	A4: constant(30),
	B1: constant(7),
	C1: computable(['E1', 'B1'], (E1, B1) => {
		console.log('computing C1 (From E1, B1)', E1, B1)
		return `E1: ${E1}, B1: ${B1}!`
	}),
	D1: constant(3),
	E1: computable(['A1'], A1 => {
		console.log('computing E1 (from A1)', A1)
		return A1 + 5
	}),
	F1: constant(12),
	H1: computable(['B1'], B1 => {
		console.log('computing H1 (from B1) ..slowly', B1)
		return delay(4000).then(() => B1 * 10)
	}),
	G7: computable(['A1', 'A4'], (A1, A4) => {
		console.log('computing C1 (From A1, A4)', A1, A4)
		return A1 * A4
	}),
	H2: computable(['H1'], H1 => {
		console.log('computing H2 (from H2)', H1)
		return `Waiting for H1.. ${H1 * 2}`
	}),
}

const getCellList = (rows, columns) => {
	const alphabet = R.pipe(R.split(''), R.take(rows))(
		'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	)
	const numbers = R.pipe(R.range(0), R.map(R.inc))(rows)
	return numbers.map(n => alphabet.map(l => `${l}${n}`))
}

const renderTable = (cells, values) => {
	document.body.innerHTML = `
	<table>
	  ${cells
			.map(row => `<tr>
	  		${row
				.map(cell => [cell, values[cell] || ''])
				.map(([cell, value]) => `<td data-cell="${cell}">${value}</td>`)
				.join('')}
	  </tr>`)
			.join('')}
	</table>
	`
}

let pushValue

const $values = create((add, end, error) => {
	pushValue = add
	return () => console.log('dispose valuestream')
}).scan((values, [ref, cell]) => R.assoc(ref, cell, values), {})

const $stream = most
	.from(R.toPairs(sheet))
	.map(
		([cellReference, cell]) =>
			new Promise(resolve => {
				if (!cell || cell.constant) {
					resolve([cellReference, cell.value])
				} else {
					most
						.from($values)
						.filter(hasProps(cell.dependencies))
						.skipAfter(hasProps(cell.dependencies))
						.map(values => {
							return R.apply(
								cell.formula,
								R.props(cell.dependencies, values),
							).then(cellValue => {
								resolve([cellReference, cellValue])
							})
						})
						.drain()
				}
			}),
	)
	.map(cellPromise => cellPromise.then(pushValue))
	.drain()

$values.observe(values => {
	console.log(values)
	renderTable(getCellList(10, 10), values)
})
