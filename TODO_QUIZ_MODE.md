# Quiz Mode Improvements - TODO

## Task
Make quiz mode a proper quiz interface where:
- Only questions are asked
- AI only says "correct" or "wrong"
- If answer is wrong, ask user to go to explain mode to get doubt clarified
- Only correct answers earn 15-20 XP, wrong answers get no XP

## Changes Needed

### 1. Update QUIZ MODE System Instruction
- Add instruction to ask user to switch to Explain mode when answer is wrong
- Keep responses SHORT (just correct or wrong)

### 2. Update XP Awarding Logic
- Change from fixed 20 XP to random 15-20 XP for correct answers

## Status
- [x] Edit QUIZ MODE system instruction in sendMessage function
- [x] Edit XP awarding logic to use random 15-20 XP

## Completed Changes

### 1. QUIZ MODE System Instruction Updated
- Modified the AI behavior to ask users to switch to Explain mode when answer is wrong
- AI now keeps responses very short - just "Correct!" or "Wrong!" plus a brief note about Explain mode
- Removed the previous logic of providing hints after 3 failed attempts

### 2. XP Awarding Logic Updated
- Changed from fixed 20 XP to random 15-20 XP for correct answers
- Used `Math.floor(Math.random() * 6) + 15` to generate random XP between 15-20
- Wrong answers continue to get no XP (already the case)
