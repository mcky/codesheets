import React from 'react'

import getValues from '../../resolve-sheet'
import exampleSheet from '../../example-sheet'

import SpreadsheetContainer from '../SpreadsheetContainer'

const value$ = getValues(exampleSheet)
const Spreadsheet = SpreadsheetContainer(value$)

const App = () => (
	<div>
		<Spreadsheet />
	</div>
)

export default App
