import React from 'react'
import { combine } from 'most'
import { componentFromStreamWithConfig } from 'recompose'
import mostConfig from 'recompose/mostObservableConfig'

import Spreadsheet from '../../components/Spreadsheet'

const componentFromStream = componentFromStreamWithConfig(mostConfig)

export default $values =>
	componentFromStream(() =>
		combine(values => <Spreadsheet {...{ values }} />, $values),
	)
