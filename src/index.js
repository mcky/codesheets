import React from 'react'
import ReactDOM from 'react-dom'

import SpreadsheetContainer from './containers/SpreadsheetContainer'
import value$ from './resolve-sheet'

import './index.css'

const Spreadsheet = SpreadsheetContainer(value$)

const App = () => <Spreadsheet />

ReactDOM.render(<App />, document.getElementById('root'))
