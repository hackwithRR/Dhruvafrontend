## PYQ Feature Implementation Plan - ExamPrepModal

**Status: In Progress** ✅

### Breakdown of Steps:
- [x] **Step 1**: Create TODO.md with approved plan
- [x] **Step 2**: Update ExamPrepModal.jsx - Add PYQ-specific state (showPyqSelector, selectedFilters, showPyqPreview, pyqMode)
- [x] **Step 3**: Modify handleOptionClick - Special handling for 'pyqs' to show selector instead of details
- [x] **Step 4**: Implement PYQ Selector View (class/board/subject/chapter dropdowns with glassmorphism)
- [x] **Step 5**: Add "Generate PYQ" button → validate → show preview
- [x] **Step 6**: Implement PYQ Preview View with explanation, benefits, two buttons (AI Generated | Classic PDF placeholder)
- [x] **Step 7**: Enhance PYQs card with new badge
- [x] **Step 8**: Test full flow, themes, responsiveness
- [ ] **Step 9**: Update TODO (mark complete), attempt_completion

**Next Step**: Proceed to Step 2 - Edit ExamPrepModal.jsx states and logic.

**Notes**:
- Static dropdown data OK
- PDF: Placeholder for now (update later)
- AI: Via onSelect('ai-pyqs-{filters}') for Chat integration
