import React from 'react'
import PropTypes from 'prop-types'

import ReactDataSheet from 'react-datasheet'
import 'react-datasheet/lib/react-datasheet.css'

const Spreadsheet = ({ values }) => (
	<ReactDataSheet
		data={values}
		valueRenderer={cell => cell.computedValue || cell.value || ''}
		overflow="clip"
	/>
)

Spreadsheet.propTypes = {
	values: PropTypes.arrayOf(PropTypes.object).isRequired,
}

export default Spreadsheet
