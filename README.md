# codesheets

Spreadsheets, but with actual code as formulae

Async cells (that depend on other async cells)
```js
formula(['A1'], A1 =>
  delay(1000).then(() => `computed ${A1} from A1`),
)
```

Execute any JS, just return a promise
```js
formula([], () =>
  fetch('https://api.punkapi.com/v2/beers/random')
    .then(res => res.json())
    .then(R.head)
    .then(R.prop('name')),
)
```

Coming soon - consume and output to streams
```js
streamable([], ($stream, { periodic }) => {
  const numbers = periodic(1000).scan((acc, n) => acc + n, 0)
  return $stream.merge(numbers)
})
```
