import R from 'ramda'
import toposort from 'toposort'

import './index.css'

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

const getDependencyOrder = R.pipe(
	R.toPairs,
	R.reduce(
		(acc, [reference, value]) =>
			value.constant
				? R.append([reference, 'init'], acc)
				: R.concat(
						acc,
						value.dependencies.map(dependency => [
							reference,
							dependency,
						]),
					),
		[],
	),
	toposort,
	R.reverse,
	R.reject(R.equals('init')),
)

const resolveSheetValues = (computationOrder, sheet, sheetValues = {}) =>
	computationOrder.reduce(
		(previousCell, reference) =>
			previousCell.then(values => {
				const cell = sheet[reference]

				return Promise.resolve(
					cell.constant
						? cell.value
						: R.apply(
								cell.formula,
								R.props(cell.dependencies, values),
							),
				).then(R.assoc(reference, R.__, values))
			}),
		Promise.resolve(sheetValues),
	)

resolveSheetValues(getDependencyOrder(sheet), sheet).then(values => {
	console.log(values)
	renderTable(getCellList(10, 10), values)
})
