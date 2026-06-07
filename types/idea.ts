export interface SourceBasis {
  type: "최근 기사" | "생활 불편함" | "학교 현장 문제" | "제품 리뷰 불만" | "사회 변화";
  summary: string;
  searchHint: string;
}

export interface SearchKeywords {
  patent: string[];
  contestWinners: string[];
  products: string[];
  general: string[];
  expanded: string[];
}

export interface IdeaScores {
  problemClarity?: number;
  novelty?: number;
  feasibility?: number;
  contestSuitability?: number;
  patentPotential?: number;
  developmentPotential?: number;
}

export interface Idea {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  targetSchoolLevel: string;

  problem: string;
  userPainPoint?: string;
  targetUser: string;
  usageSituation: string;

  coreIdea: string;
  idealSolution: string;
  realisticSolution: string;
  prototypePlan: string;
  operatingPrinciple: string;

  expectedMaterials: string[];
  expectedDifficulty: "easy" | "medium" | "hard";
  expectedCostLevel: "low" | "medium" | "high";

  patentPotential: string;
  contestSuitability: string;
  noveltyNote: string;
  similarRiskNote: string;

  sourceBasis: SourceBasis[];
  searchKeywords: SearchKeywords;

  status: "draft" | "saved" | "failed" | "excellent" | "developing";

  scores?: IdeaScores;
  averageScore: number;

  failureReason?: string;
  improvementMemo?: string;

  createdAt: any; // Firestore Timestamp
  updatedAt: any;

  // Migration fields for future Firebase Auth transition
  createdBy?: string;
  updatedBy?: string;
}

export interface Rating {
  id: string;
  ideaId: string;

  problemClarity: number;       // 문제의 명확성 1~5
  novelty: number;              // 새로움 1~5
  feasibility: number;          // 학생 제작 가능성 1~5
  contestSuitability: number;   // 발명대회 적합성 1~5
  patentPotential: number;      // 특허 가능성 1~5
  developmentPotential: number; // 발전 가능성 1~5

  averageScore: number;
  memo?: string;

  createdAt: any; // Firestore Timestamp

  // Migration fields for future Firebase Auth transition
  ratedBy?: string;
}

export interface Failure {
  id: string;
  ideaId: string;

  title: string;
  category: string;
  averageScore: number;

  failureReason: string;
  weakPoints: string[];
  reusePotential: string;

  createdAt: any; // Firestore Timestamp
}

export interface SuggestedIdea {
  title: string;
  coreIdea: string;
  realisticPrototype: string;
  reason: string;
  risk: string;
}

export interface Painpoint {
  id: string;

  userInput: string;
  analyzedProblem: string;
  targetUser: string;
  existingSolutions: string[];
  limitations: string[];

  suggestedIdeas: SuggestedIdea[];

  createdAt: any; // Firestore Timestamp
}

export interface DevelopmentLog {
  id: string;
  ideaId: string;

  version: number;
  originalIdeaSummary: string;
  improvedCoreIdea?: string;

  idealSolution: string;
  realisticSolution: string;
  prototypePlan: string;
  operatingPrinciple: string;

  materials: string[];
  estimatedCost: string;
  difficulty: string;

  patentSearchKeywords: string[];
  contestWinnerSearchKeywords: string[];
  productSearchKeywords: string[];

  differentiationPoints: string[];
  guidanceForStudent: string[];

  createdAt: any; // Firestore Timestamp

  // Migration fields for future Firebase Auth transition
  createdBy?: string;
}

export interface AiLog {
  id: string;
  provider: "gemini" | "openai";
  model: string;
  task: "generate" | "analyze" | "develop";
  success: boolean;
  errorType?: string;
  prompt?: string;
  response?: string;
  createdAt: any; // Firestore Timestamp
}
