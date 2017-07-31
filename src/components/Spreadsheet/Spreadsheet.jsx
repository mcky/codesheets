import React from 'react'

import ReactDataSheet from 'react-datasheet'
import 'react-datasheet/lib/react-datasheet.css'

const Spreadsheet = ({ values }) => {
  return (
    <ReactDataSheet
      data={values}
      valueRenderer={cell => cell.value || ''}
      overflow="clip"
    />
  )
}

export default Spreadsheet
