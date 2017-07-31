import {
	curry,
	where,
	equals,
	has,
	assoc,
	repeat,
	pipe,
	toUpper,
	split,
	map,
	partition,
	is,
	add,
} from 'ramda'

const hasProps = curry((props, obj) => props.every(prop => obj[prop]))

const hasRefWithValue = ref => where({ 0: equals(ref), 1: has('value') })

const scanPairs = (values, [ref, cell]) => assoc(ref, cell, values)

const getCellList = (rows, columns, cell) => repeat(repeat(cell, rows), columns)

const charIndex = char => parseInt(char, 36) - 10

const cellIndexFromRef = pipe(
	toUpper,
	split(''),
	map(cell => (isNaN(Number(cell)) ? cell : Number(cell))),
	partition(is(Number)),
	([numbers, letters]) => {
		const x = letters.map((l, i) => charIndex(l) + i * 26).reduce(add)
		const y = Number(numbers.join('')) - 1
		return [y, x]
	},
)

export { hasProps, hasRefWithValue, scanPairs, getCellList, cellIndexFromRef }
