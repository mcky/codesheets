import { memoize } from 'ramda'

export const constant = val => ({
	isConstant: true,
	value: val,
})

export const formula = (dependencies, formula) => ({
	isFormula: true,
	dependencies,
	formula: memoize((...args) => Promise.resolve(formula(...args))),
	formulaString: formula.toString(),
})
