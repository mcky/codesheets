import {
	curry,
	where,
	equals,
	has,
	assoc,
	repeat,
	pipe,
	split,
	toUpper,
	map,
	add,
	addIndex,
	range,
	inc,
	dec,
	xprod,
	join,
	of,
	append,
	fromPairs,
	match,
	reduce,
	adjust,
} from 'ramda'

const hasProps = curry((props, obj) => props.every(prop => obj[prop]))

const hasRefWithValue = ref => where({ 0: equals(ref), 1: has('value') })

const scanPairs = (values, [ref, cell]) => assoc(ref, cell, values)

const createMatrix = (rows, columns, value) =>
	repeat(repeat(value, rows), columns)

const alphabet = 'abcdefghijklmnopqrstuvwxyz'
const cellLetter = i =>
	(i >= 26 ? cellLetter(((i / 26) >> 0) - 1) : '') + alphabet[(i % 26) >> 0]

const mapIndexed = addIndex(map)

const getLetterRange = pipe(range(0), mapIndexed(cellLetter))
const getNumRange = pipe(inc, range(1))

const createSheet = (w, h, initial) => {
	const letters = getLetterRange(w)
	const numbers = getNumRange(h)

	return pipe(xprod, map(join('')), map(pipe(of, append(initial))), fromPairs)(
		letters,
		numbers,
	)
}

const charIndex = char => parseInt(char, 36) - 10

const splitReference = match(/[A-Z]+|[0-9]+/g)

const cellLetterIndex = pipe(
	split(''),
	mapIndexed((l, i) => charIndex(l) + i * 26),
	reduce(add, 0),
)

const cellNumberIndex = pipe(Number, dec)

const cellIndexFromRef = pipe(
	toUpper,
	splitReference,
	adjust(cellLetterIndex, 0),
	adjust(cellNumberIndex, 1),
)

export {
	hasProps,
	hasRefWithValue,
	scanPairs,
	createSheet,
	createMatrix,
	splitReference,
	cellLetterIndex,
	cellIndexFromRef,
}
