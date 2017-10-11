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

export const hasProps = curry((props, obj) => props.every(prop => obj[prop]))

export const hasRefWithValue = ref => where({ 0: equals(ref), 1: has('value') })

export const scanPairs = (values, [ref, cell]) => assoc(ref, cell, values)

export const createMatrix = (rows, columns, value) =>
	repeat(repeat(value, rows), columns)

export const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const cellLetter = i =>
	(i >= 26 ? cellLetter(((i / 26) >> 0) - 1) : '') + alphabet[(i % 26) >> 0]

export const mapIndexed = addIndex(map)

export const getLetterRange = pipe(range(0), mapIndexed(cellLetter))
export const getNumRange = pipe(inc, range(1))

export const createSheet = (w, h, initial) => {
	const letters = getLetterRange(w)
	const numbers = getNumRange(h)

	return pipe(xprod, map(join('')), map(pipe(of, append(initial))), fromPairs)(
		letters,
		numbers,
	)
}

export const charIndex = char => parseInt(char, 36) - 10

export const splitReference = match(/[A-Z]+|[0-9]+/g)

export const cellLetterIndex = pipe(
	split(''),
	mapIndexed((l, i) => charIndex(l) + i * 26),
	reduce(add, 0),
)

export const cellNumberIndex = pipe(Number, dec)

export const cellIndexFromRef = pipe(
	toUpper,
	splitReference,
	adjust(cellLetterIndex, 0),
	adjust(cellNumberIndex, 1),
)
