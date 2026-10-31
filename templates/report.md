<!-- levelwith report template. Fill every line. Run: node scripts/levelwith-lint.mjs THIS_FILE -->
# <what this reports>

**Weakest relevant number first:** <the least flattering number that matters, e.g. "recall 0.23">
**Data type:** <real-use | replay | tuned-on | held-out/unseen | synthetic | self-made>, n=<count>
**What this does NOT show:** <the limits: not live, not adaptive, one user, tuned, …>

## Detail
<the rest of the numbers, each with its data type. Any strong word ("novel", "best", "cracked")
needs a citation and a number on the same line, or the linter flags it. A CAPABILITY claim — a word
about what the code does ("ai-scored", "ai-native", "agentic") — needs a MECHANISM POINTER on the same
line instead: a code path / file / CHECK the reader can open, e.g. "scored by `model.generate()` in
service.py:267", not a number. A number proves a measurement, not a mechanism.>

## Honest self-review (answer each — these are the failures no script can judge)
<!-- `levelwith-lint.mjs THIS_FILE --report` checks each is ANSWERED, not that the answer is true. -->
- Padding — is any of this volume standing in for progress? <answer>
- Tied to the stated goal or a measured problem? <answer>
- Limits disclosed here proactively, not only if asked? <answer>
- What decision will rest on this, and is the picture accurate? <answer>
- Center vs substrate — which core gate's *measured* status changed, and what is built vs only
  designed? If no core gate's status moved, say "substrate only, center still empty". <answer>
