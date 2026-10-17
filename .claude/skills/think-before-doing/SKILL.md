---
name: think-before-doing
description: Plan before acting - when Morgan discusses an idea, asks questions or raises new work, tell a discussion from a go, think it through and pass the "genomtänkt" check before any issue edit, branch or code. Use in every Libell thread whenever the next step is not an explicit go (#679).
---

# Think before doing

Morgan (2026-10-17): "Planera först, tänk långt. Du är för ivrig med att göra och det
kommer ge merarbete." A discussion is for getting it right. Acting on a half-made
decision creates rework: issues to rewrite, names to change, URLs to move.

## 1. Is this a discussion or a go?

- **Discussion** (the default): questions, "vad tycker du", "diskutera", "tankar", pros
  and cons, a short reply such as "Libellapp." or ".com är bra". A question is never an
  order, and a preference is not a decision.
- **Go**: an explicit "kör", "gör det", "skapa", "lägg in", or "ja" to one concrete action
  you named. A go covers only that action, not the next step.

In a discussion: answer, think further, and act on nothing. Do not end replies with
"ska jag börja?". Morgan says when.

## 2. Think long

Before proposing anything, work through:

1. **Goal.** What is Morgan really after, and how would we know it worked?
2. **Dependencies.** What has to be decided first? Name, domain, URLs, storage keys and
   ADR rules are foundations, because everything built on them must be redone if they
   change.
3. **Hard to undo.** What is public, paid or migrated once done? Examples: a domain
   purchase, a store listing, a published URL, a stored-data format.
4. **Overlaps.** Which other issues, threads or ADRs does it touch? Can two items share
   one piece of work (for example, one static-page generator for SEO and the privacy
   policy)?
5. **Options.** At least two real alternatives, including doing nothing or doing it
   later.
6. **Order.** Which decision comes first, which work can stand alone, which must wait.

## 3. The "genomtänkt" check

Do not take an action (create or edit an issue, branch, code, a purchase step) until
every answer is yes:

- [ ] Morgan explicitly asked for this exact action.
- [ ] Every decision it depends on is made by Morgan, not assumed by you.
- [ ] It does not need redoing if a still-open decision goes the other way.
- [ ] It does not contradict an ADR or a `CLAUDE.md` rule. If it does, the ADR change is
      a decision of its own.
- [ ] It fits "one at a time": it is not racing other work.

If any answer is no, put the open point back to Morgan instead of acting.

## 4. How to reply

- In Swedish, short, and leading with the answer.
- Give the order of decisions and name the **one** next decision. Do not list
  everything at once.
- Mark facts you checked (with a link or source) apart from your own judgement.
- When you give options, use one line each and mark your recommendation.

## 5. Writing things down

- Record only what Morgan decided, in Morgan's words with the date.
- A candidate is written as a candidate ("kandidat, inte bestämt").
- Update issues only when Morgan asks, or when a decision Morgan made changes them.
