import { memoize } from 'ramda'

export const constant = val => ({
	isConstant: true,
	value: val,
})

export const formula = (dependencies, formulaFn) => ({
	isFormula: true,
	dependencies,
	formula: memoize((...args) => Promise.resolve(formulaFn(...args))),
	formulaString: formulaFn.toString(),
})
