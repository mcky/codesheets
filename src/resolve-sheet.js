import R from 'ramda'
import * as most from 'most'
import { hold } from '@most/hold'

import { hasProps, scanPairs, getCellList, cellIndexFromRef } from './utils'

const formatSheetObject = (time, sheet) =>
	R.pipe(R.toPairs, R.map(R.append(time)))(sheet)

const getValues = initialSheet => {
	const initialValues = formatSheetObject(Date.now(), initialSheet)
	const change$ = most.from(initialValues)

	const constantValue$ = most
		.from(change$)
		.filter(([, cell]) => cell.isConstant)
		.map(([ref, cell]) => [ref, cell.value, cell])

	const formulaChange$ = most.from(change$).filter(([, cell]) => cell.isFormula)

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
				.map(value => [ref, value, cell])
		})
		.join()

	const EMPTY_CELL = { value: null, width: 35, className: 'SpreadsheetCell' }
	const INITIAL_CELLS = getCellList(10, 10, EMPTY_CELL)

	return most
		.mergeArray([constantValue$, formulaValue$])
		.scan((matrix, [ref, value, originalCell]) => {
			const [y, x] = cellIndexFromRef(ref)

			return R.over(
				R.lensPath([y, x]),
				R.pipe(R.mergeDeepRight(originalCell), R.assoc('value', value)),
				matrix,
			)
		}, INITIAL_CELLS)
}

export default getValues
