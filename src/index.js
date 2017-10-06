import React from 'react'
import ReactDOM from 'react-dom'

import App from './containers/App'
import store from './state'

import './index.css'

ReactDOM.render(
	React.createElement(App, { store }),
	document.getElementById('root'),
)
