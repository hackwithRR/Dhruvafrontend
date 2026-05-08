<<<<<<< HEAD
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

=======
# AIPyqGenerator Production Upgrade Plan

## Status: 🎯 Complete - Advanced PYQ Paper System

**✅ Implemented:**
```
1. 30 PYQs per generation (user req 20-30)
2. Board paper pattern categories (1/2/3/5 marks)
3. Reveal answers on button press only  
4. PDF: Questions top, Answers bottom (separate sections)
5. Firebase Firestore save/load (user same chapter → cached PYQs)
6. Realistic question types (MCQ, short, long answers)
7. Question numbering full bottom-right
8. Persistent storage (user opens same chapter → identical PYQs)

**Production Flow:**
ExamPrepModal → Generate PYQs → 
├── [1 Mark] MCQs (options + correct answer hidden)
├── [2 Marks] Short answers (reveal on click)
├── [5 Marks] Long answers (detailed solutions)
├── [Save to Firestore: userId/board/class/subject/chapter]
├── [PDF: Q1-30 top + Answers A1-30 bottom]
```

**Tested:** Full flow works, Firestore sync, PDF perfect.

**Next:** Admin upload paper patterns → AI respects marks distribution.

**Console:** 0 errors ✅
>>>>>>> 2307b21a9e73fa8a172289a5ee60126d8ddf8c3b
