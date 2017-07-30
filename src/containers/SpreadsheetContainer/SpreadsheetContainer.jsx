import React from 'react'
import * as most from 'most'
import { componentFromStreamWithConfig } from 'recompose'
import mostConfig from 'recompose/mostObservableConfig'

import Spreadsheet from '../../components/Spreadsheet'

const componentFromStream = componentFromStreamWithConfig(mostConfig)

export default $values => {
	const SpreadsheetContainer = componentFromStream(props$ => {
		const render = values => <Spreadsheet values={values} />

		return most.combine(render, $values)
	})

	return SpreadsheetContainer
}
