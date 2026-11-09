# Bulls & Cows

A small code-breaking game built with TypeScript. No framework, backend or runtime libraries.

## Run locally

Use Node.js 22.22.1 or newer (Node 24 or 26 also works).

```sh
npm ci
npm start
```

Open the local URL printed by the server, normally `http://localhost:8080`.
`npm start` builds the project first. After editing TypeScript, run `npm run build` again and refresh the page.

## Play

1. Choose a number system: binary, octal, decimal or hexadecimal.
2. Choose a code length from 2 to 6. Binary only allows 2 digits.
3. Start a round and enter guesses with different digits. A leading zero is allowed.
4. A bull means the right digit in the right place. A cow means the right digit in a different place.
5. Keep guessing until all digits are bulls. There is no attempt limit.

Uppercase hexadecimal letters are accepted. Invalid characters are filtered out, and repeated guesses are not added to the history.

The top ten results are sorted by attempts, then elapsed time. Every entry shows its base and code length. Records are stored in this browser's localStorage; a warning is shown if storage is unavailable. A round in progress is not restored after a reload.

## Checks

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

`npm run format` formats the files. `npm run test:watch` starts Vitest in watch mode.

Husky hooks are installed by `npm ci`:

- `pre-commit` runs only lint-staged: ESLint and Prettier checks on staged files, without tests or automatic rewriting.
- `pre-push` runs `npm test` and rejects failing tests.

## Structure

- `src/logic.ts` — the five required functions: generation, digit validation, guess validation, evaluation and memoized permutation counting.
- `src/game.ts` — immutable game state, scoring records and validation of stored records.
- `src/main.ts` — DOM creation, events, timer and localStorage. The HTML body is empty; all UI is created in TypeScript.
- `tests/` — deterministic Vitest tests with no DOM or network access.
- [DESIGN.md](DESIGN.md) — algorithms, data structures, Big O and clean-code decisions.

TypeScript is compiled to native browser ES modules with `tsc`; there is no bundler.

## TDD history

Each required function has a separate failing-test commit followed by its implementation:

| Function               | Red tests | Green implementation |
| ---------------------- | --------- | -------------------- |
| `createDigitValidator` | `f1181f9` | `9d39ea0`            |
| `isValidGuess`         | `5a813d6` | `61fe9ef`            |
| `generateSecret`       | `c9e9529` | `81fec85`            |
| `evaluateGuess`        | `590a09c` | `efb9f58`            |
| `countPossibleSecrets` | `d4b9fae` | `4c97d16`            |

## Publication — run these steps yourself

The assignment requires a private personal repository. Work is in `bulls-and-cows`; `main` contains only the initial README and `.gitignore`.

```sh
npm run deploy
```

**This command builds and pushes `dist/` to the `gh-pages` branch.** It has not been executed as part of local implementation.

In GitHub Settings → Pages, select `gh-pages` and `/ (root)`. If Pages is unavailable for your private repository, upload the built `dist/` folder to another static host, for example Netlify Drop. The relative asset paths also work under a repository subpath.

Open your own Pull Request from `bulls-and-cows` to `main`, do not merge it, and submit its link through RS App. Before submission, check the public deployment, attach a screenshot, link DESIGN.md and include the TDD pairs and behavior checklist in the PR.
