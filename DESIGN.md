# Design

## 1. Data and functional boundaries

`src/logic.ts` contains the five required functions. It does not import the DOM, browser storage or a clock. No game logic uses classes or external libraries.

The secret and guesses are strings, not numbers. This keeps leading zeroes (`0123`) and hexadecimal digits intact. Digit comparisons are case-insensitive: strings are normalized with `toLowerCase()` before comparing.

`src/game.ts` defines:

- `Settings`: a readonly object with `length` and `base`.
- `GameState`: settings, secret, a readonly history array, status (`playing` or `won`), start time and optional finish time.
- `Attempt`: the normalized guess and its `bulls`/`cows` result.
- `GameRecord`: settings, attempt count, elapsed milliseconds and a finish timestamp.

`createGame` copies settings. `submitGuess` returns a new state and adds a new entry with `[...state.history, entry]`. Previous arrays and entries are not edited. Invalid, duplicate and post-win submissions return the original state. Tests freeze earlier objects and arrays to catch accidental mutations.

Time is passed into the core functions. In `src/main.ts`, `performance.now()` supplies monotonic round timing, while `Date.now()` supplies the stored completion timestamp. Randomness, clocks, DOM updates and localStorage are confined to the UI boundary. The only internal cache is the explicitly required permutation memoization; it changes performance, not results.

## 2. Algorithms

### `generateSecret(length, base, random = Math.random)`

Start with the first `base` characters of `0123456789abcdef`. For each of `length` positions, choose an index using the supplied `random`, take that digit and create a new pool without it using `filter`. Join the selected digits.

Sampling from the remaining pool guarantees unique digits and allows zero in the first position. Arguments and random values are validated. No caller-owned array is mutated. Local reassignment of the private pool cannot change another call's data.

The UI uses the default random source. Tests inject fixed sources such as `() => 0` and `() => 0.999`, so they do not depend on chance. The generator is deterministic when given the same random sequence. It is intentionally not claimed that its default `Math.random` call is deterministic.

### `createDigitValidator(base)` and `isValidGuess(guess, length, base)`

`createDigitValidator` captures the allowed alphabet for one base and returns a single-character predicate. The returned function normalizes case and rejects multi-character strings.

`isValidGuess` uses that predicate with `every`, checks the exact length, and compares the size of a `Set` with the requested length to detect repeated digits. `a` and `A` therefore count as the same digit.

The same factory is used in the `input` event handler in `src/main.ts` to filter typing and pasted text in real time. It is not a demonstration-only helper.

### `evaluateGuess(secret, guess)`

Normalize both inputs. Reject unequal lengths and duplicate digits. Build a `Set` of the secret digits. One `filter` counts exact position matches (bulls); another counts all guess digits present in that set. Cows are total matches minus bulls.

Because guesses and secrets contain unique digits, each match is counted once. Array callbacks perform the actual comparison, not just rendering. There are no manual counter loops. A fresh result object is returned on every call.

### `countPossibleSecrets(length, base)`

A zero-length code has one arrangement. Otherwise use the recursive relation:

`P(base, length) = base × P(base - 1, length - 1)`.

Zero is an ordinary first digit, so no combinations are subtracted. For example, a four-digit decimal code has `10 × 9 × 8 × 7 = 5040` possibilities.

A module-local `Map` caches results by `length:base`. Repeated settings reuse the result, and recursive subproblems are cached too. Invalid inputs are rejected before lookup. The `length = 0` case is accepted for the recurrence; the UI only offers lengths 2–6.

### Records

`addRecord` copies the old list before sorting it by attempt count and then elapsed milliseconds, and keeps ten results. Each result includes its base and length so the common leaderboard does not hide how the result was achieved.

`parseRecords` treats JSON as `unknown`, validates each record and ignores malformed entries. Invalid JSON or an absent value becomes an empty list. Storage reads and writes are performed only in `src/main.ts`; blocked storage shows a warning without preventing play.

## 3. Complexity

Let `n` be the code length, `b` the alphabet size, `h` the number of previous attempts and `r` the number of records. The game restricts `b` to at most 16 and `n` to at most 6, but the bounds below describe the algorithm rather than hiding those parameters.

| Function                          | Time            | Extra space          | Reason                                                                                                                                                                            |
| --------------------------------- | --------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generateSecret`                  | `O(n × b)`      | `O(b + n)` peak      | Each selected digit filters a pool of at most `b` digits; the output has `n` digits. Only the current pool and output need to remain live.                                        |
| `evaluateGuess`                   | `O(n)` expected | `O(n)`               | Normalization, Set construction and the filters are linear; Set lookups have expected constant cost.                                                                              |
| `isValidGuess`                    | `O(n × b)`      | `O(n)`               | Each digit uses a string `includes` check over at most `b` characters, then a Set detects duplicates. With the supported alphabet capped at 16 this is effectively linear in `n`. |
| `countPossibleSecrets` — uncached | `O(n)`          | `O(n)` per cold call | Each recursive level reduces the length by one and performs a cache lookup and multiplication. It adds at most `n + 1` entries.                                                   |
| `countPossibleSecrets` — cached   | `O(1)` expected | `O(1)` per hit       | One key lookup returns an already computed number. Across different settings, the cache can hold `O(b²)` pairs.                                                                   |

The generator's simple pool filtering is deliberate. A partial Fisher–Yates shuffle would reduce generation time for large alphabets, but the alphabet here has at most 16 characters; the filter version is easier to follow.

History lookup and immutable copying in `submitGuess` take `O(h × n)` time in the worst case (string comparisons included) and `O(h)` additional references for the new array. This is a deliberate linear history scan: the game has no attempt cap, so a separate Set of guesses could be added if very long histories became a real problem. Record insertion sorts a copy in `O(r log r)` time; the saved list is capped at ten entries.

## 4. Clean-code decisions

- **Single responsibility:** `src/logic.ts` handles digit algorithms, `src/game.ts` handles immutable state and record transformations, and `src/main.ts` handles browser side effects. Unit tests can import the core without a browser.
- **DRY:** `createDigitValidator` is reused in both `isValidGuess` and input filtering. The UI calls the tested core functions instead of maintaining a second comparison algorithm.
- **KISS / YAGNI:** native ES modules, `tsc`, standard DOM APIs and array methods are sufficient. There is no framework, backend, state-management package or custom event system. The small `element` helper in `src/main.ts` replaces repeated `createElement`/`textContent` calls without hiding markup in a builder abstraction.
- **Explicit names and boundaries:** `startedAt`, `finishedAt`, `durationMs` and `settings` make units and ownership clear. Invalid stored data is validated rather than trusted through a type assertion.
- **Immutable state:** readonly types document ownership; spreading state and history preserves previous snapshots. Sorting records starts from a new array.
- **Early returns:** invalid and duplicate submissions in `submitGuess` stop before changing state; UI handlers stop after showing their validation message.
- **Safe DOM updates:** markup is created using `createElement` and `append`, and text is assigned through `textContent`. No `innerHTML` or `insertAdjacentHTML` is used.

## 5. TDD and verification

Each of the five required functions was introduced as a throwing stub with a separate failing-test commit, followed by a separate implementation commit. The red/green hashes are listed in README.md. Tooling, the interface and documentation have their own commits.

Tests are fast, independent, deterministic and self-validating. They use fixed random sources and explicit clock values, with no network, real timers, browser or localStorage. They cover leading zeroes, uppercase hex, invalid symbols, repeated digits, bulls/cows, permutation base cases, frozen state and record ordering.

`pre-commit` checks staged files only, so red TDD commits are possible. `pre-push` runs the full test suite, so only green code should be sent to the remote. Hook verification can invoke the local hook script without making a Git push.
