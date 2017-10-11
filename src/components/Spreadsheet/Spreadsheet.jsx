import React from 'react'
import PropTypes from 'prop-types'
import { map, merge, evolve } from 'ramda'
import { mapProps } from 'recompose'

import ReactDataSheet from 'react-datasheet'
import 'react-datasheet/lib/react-datasheet.css'

import './Spreadsheet.css'

const Spreadsheet = ({ values }) => (
	<ReactDataSheet
		className="Spreadsheet"
		data={values}
		valueRenderer={cell => cell.computedValue || cell.value || ''}
		overflow="clip"
	/>
)

Spreadsheet.propTypes = {
	values: PropTypes.arrayOf(PropTypes.object).isRequired,
}

const cellDefaults = {
	width: 35,
	className: 'SpreadsheetCell',
}
const addCellDefaults = map(map(merge(cellDefaults)))

export default mapProps(
	evolve({
		values: addCellDefaults,
	}),
)(Spreadsheet)
