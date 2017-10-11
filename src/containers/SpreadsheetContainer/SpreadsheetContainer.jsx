import React from 'react'
import { map, merge, pipe, propOr, toPairs, reduce, assocPath } from 'ramda'
import { connect } from 'react-redux'

import { cellIndexFromRef } from '../../utils'

import Spreadsheet from '../../components/Spreadsheet'

const SpreadsheetContainer = ({ values }) => <Spreadsheet {...{ values }} />

const cellDefaults = {
	width: 35,
	className: 'SpreadsheetCell',
}
const addCellDefaults = map(map(merge(cellDefaults)))

export default connect(state => {
	const values = pipe(
		propOr({}, 'cells'),
		toPairs,
		reduce((acc, [ref, cell]) => {
			const [x, y] = cellIndexFromRef(ref)
			return assocPath([y, x], cell)(acc)
		}, []),
		addCellDefaults,
	)(state)

	return { values }
})(SpreadsheetContainer)
