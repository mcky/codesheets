import React from 'react'

const Spreadsheet = ({ values }) => (
	<div>
		<table>
			<tbody>
				{values.map((row, i) => (
					<tr key={i}>
						{row.map((value, j) => {
							return <td key={`${i}-${j}`}>{value}</td>
						})}
					</tr>
				))}
			</tbody>
		</table>
	</div>
)

export default Spreadsheet
