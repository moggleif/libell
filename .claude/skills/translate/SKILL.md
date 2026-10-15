---
name: translate
description: Translate Libell into a language, or review an existing one - fix the locked glossary words, translate from en.ts with each string's context, back-translate into Swedish blind, compare meaning against sv.ts and fix the deviations. Use for every new language and whenever a language's strings are reviewed (#628).
---

# Translate

Libell's Swedish is the original; English is the source every other language is
translated from. The problems Swedish users hit were never about wording but about
purpose: a "Nollställ" or "Steg 2" translated without knowing where it shows or what it
does. This skill makes every translation start from the purpose and proves it kept it.

Inputs, all in `src/ui/messages/`:

- `en.ts` — the source text and the keys.
- `sv.ts` — the original meaning, used only in step 4.
- `context.ts` — for every key: the room it has (`button`, `label`, `card`, `line`,
  `text`, `speech`), where it appears and what it does.
- `glossary.ts` — the app's fixed terms, what each means, and each language's locked
  word for it.

## Steps

1. **Read the context and the glossary, then fix the language's words.** For a new
   language, add its word to every glossary term first, as a lower-case stem every
   inflection contains. Pick the word a camper in that country would use; a term the
   language has no single word for gets the shortest clear phrase. These words are
   locked: from here on the term is always that word, never a synonym.
2. **Translate from `en.ts`**, one key at a time with its context entry open:
   - Keep the purpose the context gives, not the English wording.
   - Respect the room: a `button` or `card` must stay as short as the English or
     shorter; a `label` should; `line` and `text` may run longer.
   - Keep every `{placeholder}` and `\n` exactly; the parity test checks them.
   - Product names (ramp models, box brands) and units (mm, cm, in) stay as they are.
   - Use the language's own quotation marks and typography, and the informal or formal
     address the language's apps usually use, the same everywhere.
3. **Back-translate into Swedish without looking at the source.** Hand the new
   dictionary and `context.ts`, and nothing else, to a separate agent (or do it in a
   fresh context) that writes each string in natural Swedish. It must not see `en.ts`,
   `sv.ts` or any other language.
4. **Compare meaning, not wording**, against `sv.ts`, key by key. Report only:
   - a different action or purpose ("Zero the vehicle" back as "Kalibrera fordonet");
   - something added or dropped that the user acts on (a step, a condition, a warning);
   - a glossary term rendered with another word than the locked one.
     Different words with the same meaning are fine and are not reported.
5. **Fix the deviations** in the language's dictionary. Then run
   `npm run format:check && npm run typecheck && npm run test` (the glossary test checks
   the locked words in their anchor strings; `src/ui/i18n.test.ts` checks that strings
   naming the same thing, like the Sensorbox or a tab, say it the same way), `npm run build && npm run fit`, and look
   at every screen in `?demo` in both themes: level view, Settings tabs, help, the
   introduction, the Sensorbox page (`?xparkle-sim`) and spoken guidance.
6. **Report in the PR description**: each deviation found, as key, what the
   back-translation said, and what was changed, plus any glossary word chosen.

## Adding a language

Besides the dictionary: add it to `MESSAGES` and `LANGUAGE_NAMES` in `src/ui/i18n.ts`,
its words to every term in `glossary.ts` (TypeScript refuses a term without them), its
word for inches in the spoken guidance strings, the fit test's language list, and R13 in
`docs/02-REQUIREMENTS.md`.

## Adding a string

A new key in `en.ts` needs a context entry in `context.ts` (the parity test fails
without one) and a translation in every language, written with this skill's steps 2–4
for that key.
