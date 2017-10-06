import React from 'react'
import { Provider } from 'react-redux'

import getValues from '../../resolve-sheet'
import exampleSheet from '../../example-sheet'

import SpreadsheetContainer from '../SpreadsheetContainer'

const value$ = getValues(exampleSheet)
const Spreadsheet = SpreadsheetContainer(value$)

const App = ({ store }) => (
	<Provider {...{ store }}>
		<Spreadsheet />
	</Provider>
)

export default App
