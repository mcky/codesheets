import R from 'ramda'
import toposort from 'toposort'

const delay = ms =>
	new Promise(resolve => {
		setTimeout(resolve, ms)
	})

const computable = (dependencies, formula) => ({
	computable: true,
	dependencies,
	formula,
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

console.log(getDependencyOrder(sheet))

const resolveSheetValues = (computationOrder, sheet, sheetValues = {}) =>
	computationOrder.reduce((values, reference) => {
		const cell = sheet[reference]

		if (cell.constant) {
			return R.assoc(reference, cell.value, values)
		} else if (cell.formula) {
			const depValues = cell.dependencies.map(
				reference => values[reference],
			)
			const cellValue = cell.formula(...depValues)
			return R.assoc(reference, cellValue, values)
		}
	}, sheetValues)

console.log(resolveSheetValues(getDependencyOrder(sheet), sheet))
