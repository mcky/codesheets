import React from 'react'
import PropTypes from 'prop-types'
import { pipe, propOr, toPairs, reduce, assocPath } from 'ramda'
import { connect } from 'react-redux'

import { cellIndexFromRef } from '../../utils'

import Spreadsheet from '../../components/Spreadsheet'

const SpreadsheetContainer = ({ values }) => <Spreadsheet {...{ values }} />

SpreadsheetContainer.propTypes = {
	values: PropTypes.arrayOf(PropTypes.object).isRequired,
}

export default connect(state => {
	const values = pipe(
		propOr({}, 'cells'),
		toPairs,
		reduce((acc, [ref, cell]) => {
			const [x, y] = cellIndexFromRef(ref)
			return assocPath([y, x], cell)(acc)
		}, []),
	)(state)

	return { values }
})(SpreadsheetContainer)
