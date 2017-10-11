import React from 'react'
import { Provider } from 'react-redux'

import SpreadsheetContainer from '../SpreadsheetContainer'

const App = ({ store }) => (
	<Provider {...{ store }}>
		<SpreadsheetContainer />
	</Provider>
)

export default App
