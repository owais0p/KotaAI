---
Task ID: 1
Agent: Main Agent
Task: Fix preview panel not working + MCQ limit bug

Work Log:
- Diagnosed that the dev server process was not running (port 3000 not in use)
- Restarted the dev server multiple times - discovered it was crashing after requests
- Server needs `nohup` and `disown` to persist in background
- Eventually got server running stably with `nohup node node_modules/.bin/next dev -p 3000`

- Investigated MCQ limit bug: user reported only 10 MCQs per subject instead of 50
- Root cause 1: Free plan limit was only 5 MCQs/day (too restrictive)
- Root cause 2: Practice API filtered out already-attempted questions, so users who practiced before would see fewer questions
- Fixed practice API to include previously attempted questions (shuffled) to fill quota when unattempted ones run out
- Also scoped the attempt tracking to per-subject (was tracking all subjects globally)

- Increased free plan MCQ limit from 5 to 40 per day (10 per subject × 4 subjects)
- Updated usage API limits to match (40 for free, -1 for pro/premium)
- Updated dashboard descriptions: "50 MCQs per subject" for practice action, "10 MCQs/subject/day" for free plan CTA
- Fixed lint warning (unused eslint-disable directive)
- Added cross-origin preview domain to allowedDevOrigins in next.config.ts

Stage Summary:
- Dev server is running on port 3000 and returning 200
- Pro/Premium users now get all 50 questions per subject
- Free users get 40 questions per day (10 per subject)
- Previously attempted questions are now recycled (shuffled) to fill quotas
- All API endpoints verified working via curl tests
