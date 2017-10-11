import React from 'react'
import PropTypes from 'prop-types'
import { pipe, map, merge, evolve, prepend, __ } from 'ramda'
import { mapProps } from 'recompose'

import ReactDataSheet from 'react-datasheet'
import 'react-datasheet/lib/react-datasheet.css'

import { mapIndexed, alphabet } from '../../utils'

import './Spreadsheet.css'

const cellDefaults = {
	width: 35,
	className: 'SpreadsheetCell',
}
const addCellDefaults = map(map(merge(cellDefaults)))

const headerCell = value => ({ value, className: 'HeaderCell' })

const addColHeader = rows =>
	pipe(mapIndexed((_, i) => headerCell(alphabet[i])), prepend(__, rows))(rows)

const addRowHeader = mapIndexed((row, i) => prepend(headerCell(i), row))

const addHeaders = pipe(addColHeader, addRowHeader)

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

export default mapProps(
	evolve({
		values: pipe(addCellDefaults, addHeaders),
	}),
)(Spreadsheet)
