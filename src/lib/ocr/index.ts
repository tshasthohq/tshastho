import { extractWithOpenAi } from './providers/openai';
import { extractWithGoogleVision } from './providers/google-vision';

export type OcrProvider = 'MANUAL' | 'OPENAI' | 'GOOGLE_VISION';

export interface OcrResult {
  text: string;
  items: { medicineName: string; strength?: string }[];
  confidence: number;
  provider: OcrProvider;
  error?: string;
}

export async function extractPrescription(imageUrl: string): Promise<OcrResult> {
  const provider = (process.env.OCR_PROVIDER as OcrProvider) || 'MANUAL';

  // OpenAI
  if (provider === 'OPENAI' && process.env.OPENAI_API_KEY) {
    const r = await extractWithOpenAi(process.env.OPENAI_API_KEY, imageUrl);
    return {
      text: r.text,
      items: r.items,
      confidence: r.confidence,
      provider: 'OPENAI',
      error: r.error,
    };
  }

  // Google Vision
  if (provider === 'GOOGLE_VISION' && process.env.GOOGLE_VISION_API_KEY) {
    const r = await extractWithGoogleVision(process.env.GOOGLE_VISION_API_KEY, imageUrl);
    return {
      text: r.text,
      items: r.items,
      confidence: r.confidence,
      provider: 'GOOGLE_VISION',
      error: r.error,
    };
  }

  // Auto-fallback: try OpenAI if key exists
  if (process.env.OPENAI_API_KEY) {
    const r = await extractWithOpenAi(process.env.OPENAI_API_KEY, imageUrl);
    return {
      text: r.text,
      items: r.items,
      confidence: r.confidence,
      provider: 'OPENAI',
      error: r.error,
    };
  }

  // Manual fallback
  return { text: '', items: [], confidence: 0, provider: 'MANUAL' };
}
