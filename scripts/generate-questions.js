const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

// Manually parse .env file to avoid dependencies
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const parts = line.trim().split('=');
      if (parts.length >= 2 && !line.startsWith('#')) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey || apiKey === 'your_key_here' || apiKey.trim() === '') {
  console.error("Error: GROQ_API_KEY is not configured in .env file.");
  process.exit(1);
}

const groq = new Groq({ apiKey });

const subjectsData = {
  Physics: ['Mechanics', 'Electrostatics', 'Optics', 'Thermodynamics', 'Modern Physics'],
  Chemistry: ['Organic Chemistry', 'Chemical Bonding', 'Thermodynamics', 'Electrochemistry', 'Chemical Kinetics'],
  Maths: ['Calculus', 'Algebra', 'Coordinate Geometry', 'Probability', 'Trigonometry'],
  Biology: ['Cell Biology', 'Genetics', 'Human Physiology', 'Ecology', 'Molecular Biology']
};

const destPath = path.join(__dirname, '../src/lib/questions.json');

// Load already generated questions if the file exists
let existingQuestions = [];
if (fs.existsSync(destPath)) {
  try {
    existingQuestions = JSON.parse(fs.readFileSync(destPath, 'utf8'));
    console.log(`Loaded ${existingQuestions.length} existing questions from ${destPath}`);
  } catch (e) {
    console.warn(`Could not parse ${destPath}, starting fresh:`, e.message);
  }
}

// Check if a topic is already generated
function isTopicGenerated(subject, topic) {
  const count = existingQuestions.filter(q => q.subject === subject && q.topic === topic).length;
  return count >= 10;
}

async function generateTopicQuestions(subject, topic, modelName = 'llama-3.1-8b-instant', retryCount = 0) {
  console.log(`Generating 10 questions for ${subject} -> ${topic} using model ${modelName} (Attempt ${retryCount + 1})...`);

  const prompt = `Generate exactly 10 high-quality multiple-choice questions (MCQs) for JEE/NEET exam preparation in ${subject}, specifically focusing on the topic "${topic}".
Each question must be of JEE/NEET level (standard moderate to hard, including numerical-like problems with actual numbers/solutions).
Each question must have 4 options (A, B, C, D) and exactly one correct answer.

Return ONLY a valid JSON array. Do NOT wrap it in markdown codeblocks (like \`\`\`json ... \`\`\`). Do NOT include any introductory or concluding text.

IMPORTANT: Do NOT use LaTeX formatting or backslashes (\\) in math or chemistry formulas. Use plain text representation (e.g. use H2O, Delta H, arrow ->, and plain text characters) instead. Do not escape normal characters.

JSON structure of each question object must have these exact keys:
- "subject": "${subject}"
- "topic": "${topic}"
- "question": "Clear question text"
- "optionA": "Option A text"
- "optionB": "Option B text"
- "optionC": "Option C text"
- "optionD": "Option D text"
- "correctAnswer": "A", "B", "C", or "D" (must be uppercase)
- "explanation": "Detailed step-by-step explanation suitable for Indian students"
- "difficulty": "easy", "medium", or "hard"

Example format:
[
  {
    "subject": "${subject}",
    "topic": "${topic}",
    "question": "For a particle moving in a straight line...",
    "optionA": "v = u + at",
    "optionB": "v^2 = u^2 + 2as",
    "optionC": "s = ut + 0.5at^2",
    "optionD": "All of the above",
    "correctAnswer": "D",
    "explanation": "These are the standard equations of motion under uniform acceleration.",
    "difficulty": "easy"
  }
]`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert JEE and NEET tutor. You output ONLY valid JSON arrays of MCQs. No markdown wrapper, no extra text. Do not use any backslashes in math/chemistry formulas.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: modelName,
      temperature: 0.3,
      max_tokens: 8192
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Clean up response if it has code block markdown
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    }

    // Sanitize single backslashes that are not followed by valid JSON escape characters
    cleaned = cleaned.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');

    const questions = JSON.parse(cleaned);

    if (!Array.isArray(questions)) {
      throw new Error("Response is not a JSON array");
    }

    if (questions.length !== 10) {
      throw new Error(`Expected 10 questions, got ${questions.length}`);
    }

    // Validate structure of each question
    const validated = questions.map((q, idx) => {
      const reqKeys = ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer', 'explanation'];
      for (const key of reqKeys) {
        if (!q[key] || typeof q[key] !== 'string' || q[key].trim() === '') {
          throw new Error(`Missing or empty required key "${key}" in question ${idx + 1}`);
        }
      }

      const ans = q.correctAnswer.trim().toUpperCase();
      if (!['A', 'B', 'C', 'D'].includes(ans)) {
        throw new Error(`Invalid correctAnswer "${q.correctAnswer}" in question ${idx + 1}`);
      }

      return {
        subject,
        topic,
        question: q.question.trim(),
        optionA: q.optionA.trim(),
        optionB: q.optionB.trim(),
        optionC: q.optionC.trim(),
        optionD: q.optionD.trim(),
        correctAnswer: ans,
        explanation: q.explanation.trim(),
        difficulty: (q.difficulty || 'medium').trim().toLowerCase()
      };
    });

    console.log(`Successfully generated and validated 10 questions for ${subject} -> ${topic}`);
    return validated;

  } catch (error) {
    console.error(`Error generating ${subject} -> ${topic} using ${modelName}:`, error.message);
    
    // Check if rate limit (429) error
    const isRateLimit = error.message.includes('429') || error.message.includes('rate_limit') || error.status === 429;
    
    if (isRateLimit && modelName === 'llama-3.3-70b-versatile') {
      console.warn(`Hit rate limit on llama-3.3-70b-versatile. Falling back to llama-3.1-8b-instant immediately...`);
      return generateTopicQuestions(subject, topic, 'llama-3.1-8b-instant', 0);
    }
    
    if (retryCount < 4) {
      const waitTime = isRateLimit ? 5000 : 2000;
      console.log(`Retrying in ${waitTime/1000} seconds...`);
      await new Promise(r => setTimeout(r, waitTime));
      return generateTopicQuestions(subject, topic, modelName, retryCount + 1);
    }
    
    // If we failed with both or exceeded retries
    throw error;
  }
}

async function main() {
  try {
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    for (const [subject, topics] of Object.entries(subjectsData)) {
      for (const topic of topics) {
        if (isTopicGenerated(subject, topic)) {
          console.log(`Skipping ${subject} -> ${topic} (already generated)`);
          continue;
        }

        try {
          const topicQs = await generateTopicQuestions(subject, topic);
          
          // Remove any existing partial/old questions for this topic first
          existingQuestions = existingQuestions.filter(q => !(q.subject === subject && q.topic === topic));
          
          // Append new ones
          existingQuestions.push(...topicQs);
          
          // Save incrementally after each topic
          fs.writeFileSync(destPath, JSON.stringify(existingQuestions, null, 2), 'utf8');
          console.log(`Saved progress. Current total questions: ${existingQuestions.length}`);
          
          // Small delay to prevent hitting requests rate limits
          await new Promise(r => setTimeout(r, 1500));
        } catch (topicError) {
          console.error(`Failed to generate topic ${subject} -> ${topic} after all retries. Stopping execution.`);
          process.exit(1);
        }
      }
    }

    console.log(`All generation complete! Total questions saved: ${existingQuestions.length}`);
  } catch (err) {
    console.error("Fatal error in main loop:", err);
    process.exit(1);
  }
}

main();
