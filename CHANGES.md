# Changes from upstream

This is a fork of [galaxykate/tracery](https://github.com/galaxykate/tracery), based on the
`tracery2` branch at 70f69ed. Tracery is by Kate Compton, under the Apache 2.0 licence in
`LICENSE.txt`. `js/tracery/tracery.js`, `js/tracery/mods-eng-basic.js` and
`js/tracery/tracery-vis.js` have been modified as described here.

Numbers refer to [upstream issues](https://github.com/galaxykate/tracery/issues).

## Parsing

- A push rule can contain colons. `[link:http://x.org]` used to push `http`, and nested actions
  were cut at their first colon (#21).
- Commas split pushed rules only outside nested tags and actions, and `\,` is a literal comma.
- Several escapes in one rule survive being pushed. All but the last backslash used to be lost,
  which turned literal `#` back into syntax.
- Text before a trailing backslash is no longer dropped.
- Text containing `DOUBLEBACKSLASH` is no longer turned into a backslash.

## Modifiers

- Parameters can contain tags: `#story.replace(#a#,#b#)#` (#52).
- Parameters can contain dots, can nest parentheses, and can escape `,` `(` `)` `.` with a backslash.
  `.a()` means `.a`.
- A modifier is called with the node as `this`, and sees the tag's actions still active (#7).
- A modifier that throws or returns nothing records an error and leaves the text as it was.
- `.a` handles `useful`, `user`, `unidentified`, `hour`, `euro`, `one` and similar (#32).
- `.s` handles `month` and `buzz`. `.ed` handles `play` and `stop`.
- `.ing` now exists, as the documentation claimed (#49).
- `.firstS` adds no trailing space or console output (#48).
- `.capitalizeAll` handles Unicode and apostrophes (#15).
- `.capitalize` passes over leading punctuation, so `\#ubi` becomes `\#Ubi` (#39).
- `.replace` treats its replacement literally, and ignores an empty search, which used to grow text
  without limit and could kill the JavaScript engine.

## Bad input

- Names such as `constructor`, `toString` and `__proto__` are ordinary symbol and modifier names.
- Popping an unknown symbol, two symbols in one tag, and rules that aren't strings all record
  errors instead of throwing. Numbers and booleans become text.
- Distributions `weighted` and `falloff` report "not yet implemented" instead of crashing.

## Limits (#5)

One expansion stops with an error at `maxDepth` (1000) nested nodes, `maxNodes` (1,000,000) nodes or
`maxLength` (10,000,000) characters. Upstream overflows the stack or runs out of memory. Set
them with `tracery.createGrammar(raw, { maxDepth: 200 })` or as properties of the grammar. Hitting
a limit calls `clearState()`, because pops may have been skipped.

## State and reporting

- `grammar.errors` lists everything that went wrong in the most recent expansion, including inside
  actions, whose nodes aren't part of the returned tree.
- `clearState()` removes symbols created by actions and resets shuffled decks.
- `symbol.uses` records `raw` and `depth` instead of holding each node, which kept every
  expansion tree alive for the life of the grammar.
- `toJSON()` escapes keys and leaves out symbols created by actions.
- Subgrammar lookups pass their arguments properly.
- Stepped expansion (`expand(true)`) no longer produces the text `undefined`.
- `distributionVisualization` no longer needs a global `app` (#17).

## Packaging (#29, #30)

- `require("./js/tracery/tracery.js")` works, with the modifiers at `tracery.baseEngModifiers`.
- `npm test` runs the regression suite. There is nothing to build.

## Behaviour you may notice

- `##` and `#[x:1]#` produce no text, rather than `((undefined))`. An empty tag is still an error.
- A `(` inside a tag must be closed, or escaped as `\(`, because parentheses now protect modifier
  parameters. `#a(#` used to look up a symbol called `a(`.
- `.s` and `.ed` ignore case when choosing an ending, so `X` becomes `Xes`.
