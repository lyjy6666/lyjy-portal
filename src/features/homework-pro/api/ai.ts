import { apiFetch } from './client';

export type GradingProblem = {
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
  similarProblems?: string[];
};
export type GradingResult = {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  problems: GradingProblem[];
  overallComment: string;
};

type GradeResponse = { success: boolean; result?: GradingResult; message?: string };

export const gradeApi = {
  grade: (ocrText: string, subject: string, stage: string, weak: string[] = []) =>
    apiFetch<GradeResponse>('/api/homework/grade', {
      method: 'POST',
      body: JSON.stringify({ ocrText, subject, grade: stage, weak }),
    }, 60_000),
};

type OcrResponse = {
  success: boolean;
  text?: string;
  message?: string;
  /** 实际命中的识别模型，降级时便于排查 */
  model?: string;
  /** VISION_UNAVAILABLE 表示所有识别通道都不可用，前端应引导手动输入 */
  code?: string;
  fallback?: 'manual';
};

export const ocrApi = {
  /** fast=true 走快速模式（GLM 4.6V 优先，约 1 秒），否则默认高精度链 */
  recognize: (image: string, fast = false) =>
    apiFetch<OcrResponse>('/api/homework/ocr', {
      method: 'POST',
      body: JSON.stringify({ image, fast }),
    }, 60_000),
};

export type EstimateResponse = {
  success: boolean;
  estimates?: number[];
  total?: number;
  source?: 'ai' | 'local';
  notice?: string;
  message?: string;
};

/** AI 用时推测：根据年级 + 作业内容 + 薄弱项估算每条耗时；上游不可用自动本地兜底 */
export const estimateApi = {
  estimate: (items: string[], grade: string, weak: string[] = []) =>
    apiFetch<EstimateResponse>('/api/homework/estimate', {
      method: 'POST',
      body: JSON.stringify({ items, grade, weak }),
    }, 30_000),
};
