import R from 'ramda'
import toposort from 'toposort'

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
	B1: constant(7),
	C1: computable(['E1', 'B1'], (E1, B1) => `E1: ${E1}, B1: ${B1}!`),
	D1: constant(3),
	E1: computable(['A1'], A1 => A1 + 5),
	F1: constant(12),
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
