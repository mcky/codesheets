import { head, prop } from 'ramda'
import {
	constant,
	formula,
} from './utils/cells'

const delay = ms =>
	new Promise(resolve => {
		setTimeout(resolve, ms)
	})

const sheet = {
	A1: constant(50),
	A2: formula([], () =>
		fetch('https://api.punkapi.com/v2/beers/random')
			.then(res => res.json())
			.then(head)
			.then(prop('name')),
	),
	A3: formula(['A1'], A1 =>
		delay(20).then(() => `computed ${A1} from A1`),
	),
	A4: constant(30),

	A5: formula(['A1', 'A4'], (A1, A3) =>
		delay(3000).then(() => `A1:${A1} - A3:${A3}`),
	),

	A6: formula(['A5'], A5 => delay(20).then(() => `A5: ${A5}`)),

	B1: constant(7),
	C1: formula(['E1', 'B1'], (E1, B1) => {
		return `E1: ${E1}, B1: ${B1}!`
	}),
	D1: constant(3),
	E1: formula(['A1'], A1 => {
		return A1 + 5
	}),
	F1: constant(12),
	H1: formula(['B1'], B1 => {
		return delay(4000).then(() => B1 * 10)
	}),
	G7: formula(['A1', 'A4'], (A1, A4) => {
		return A1 * A4
	}),
	H2: formula(['H1'], H1 => {
		return `H1*2 = ${H1 * 2}`
	}),
}

export default sheet
