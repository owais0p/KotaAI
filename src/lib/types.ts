export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'premium';
  avatar: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  subject: string;
  createdAt: string;
}

export interface PracticeQuestion {
  id: string;
  subject: string;
  topic: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  explanation?: string;
  difficulty: string;
}

export interface PracticeAttempt {
  id: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

export interface ProgressTopic {
  id: string;
  subject: string;
  topic: string;
  completed: boolean;
  score: number;
  weakArea: boolean;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  score: number;
  rank: number;
  user: { name: string; avatar: string };
}

export type AppView = 'landing' | 'dashboard' | 'chat' | 'practice' | 'progress' | 'leaderboard' | 'auth';
export type Subject = 'Physics' | 'Chemistry' | 'Maths' | 'Biology';
