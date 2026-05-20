---
Task ID: 1
Agent: Main Agent
Task: Audit and fix KotaAI web app code for local download and run

Work Log:
- Reviewed all source files (page.tsx, layout.tsx, store.ts, types.ts, db.ts, all API routes, all components)
- Ran lint check - only error was in example websocket file, not main app
- Ran production build - compiled successfully with zero errors
- Fixed payment route crash: `new Razorpay()` at module level would crash with placeholder keys. Changed to lazy-loaded `getRazorpayInstance()` function with graceful dev-mode fallback that directly upgrades users when Razorpay is not configured
- Fixed inconsistent free plan descriptions: LandingPage said "5 MCQs per day" and AuthPage said "5 MCQs/day" but actual limit is 40/day. Updated both to show correct limits
- Also fixed Free plan showing "1 subject access" when all 4 subjects are actually available on free plan
- Cleaned up next.config.ts: removed sandbox-specific preview domain from allowedDevOrigins
- Created .env.example file for local setup instructions
- Verified: `npx eslint src/` passes with zero errors
- Verified: `npx next build` compiles successfully

Stage Summary:
- All 3 critical fixes applied: payment route safety, limit display consistency, config cleanup
- App compiles cleanly for both dev and production builds
- No code errors in the main src/ directory
- Questions.json has 200 MCQs (50 per subject: Physics, Chemistry, Maths, Biology)
- Database schema is complete with all models (User, ChatMessage, PracticeQuestion, PracticeAttempt, ProgressTopic, LeaderboardEntry, DailyUsage, Payment)
