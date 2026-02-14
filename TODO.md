# TODO: Refactor Web Speech API Logic in Chat.jsx

## Tasks:
- [ ] 1. Add helper function `isIndianMaleVoice(voice)` to check for Indian Male voice markers (Locale 'IN' + Male keywords)
- [ ] 2. Add synth.cancel() at the start of speak function
- [ ] 3. Update voice selection to prioritize hi-IN/en-IN with names like Hemant, Rishi, Prabhat
- [ ] 4. Change pitch to 0.95 for male voices and 0.8 for female voices
- [ ] 5. Change rate from 0.8 to 0.9

## Implementation Notes:
- Helper function should check:
  - Locale contains 'IN'
  - Name contains male keywords: 'hemant', 'rishi', 'prabhat', 'male', 'man', 'boy', 'kumar', 'arjun', 'rahul'
- Voice selection priorities:
  1. hi-IN or en-IN with specific names (Hemant, Rishi, Prabhat)
  2. Any IN locale with male keywords
  3. Any male voice
  4. Language match fallback
  5. First available voice
