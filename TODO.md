# TODO - PYQ Answer Marking Quality Fix

## Plan (approved)
- Enforce AI output structure strictly as per marks and board requirements.
- Maths answers must be step-by-step and align to marks.
- Maintain formatting compatibility: `//` for newlines and `[BOLD]...[/BOLD]` for bold.

## Steps
1. Update `src/components/pyq/AIPyqGenerator.jsx` generation `systemInstruction` to require exact answer points/steps per marks (1/2/3/5) and a maths step-by-step template.
2. Update `src/components/pyq/AIQuestionView.jsx` generation `systemPrompt` to enforce the same marks-wise structure within the `Solution` field.
3. (No UI changes) Verify rendering remains compatible with existing `renderFormattedAnswer` / `SolutionReveal`.
4. Run `npm test` or `npm run build` to ensure project still builds.

