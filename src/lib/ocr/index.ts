export type OcrProvider = 'MANUAL' | 'OPENAI';

export interface OcrResult {
  text: string;
  items: { medicineName: string; strength?: string }[];
  confidence: number;
  provider: OcrProvider;
  error?: string;
}

export async function extractPrescription(imageUrl: string): Promise<OcrResult> {
  const provider = (process.env.OCR_PROVIDER as OcrProvider) || 'MANUAL';

  if (provider === 'OPENAI' && process.env.OPENAI_API_KEY) {
    return extractWithOpenAI(imageUrl);
  }

  return { text: '', items: [], confidence: 0, provider: 'MANUAL' };
}

async function extractWithOpenAI(imageUrl: string): Promise<OcrResult> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Extract medicine names from prescription images. Return JSON only.' },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract medicine details. Return JSON: [{"medicineName":"name","strength":"500mg"}]. Only JSON array.' },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 800,
        temperature: 0.1,
      }),
    });

    if (!res.ok) return { text: '', items: [], confidence: 0, provider: 'OPENAI', error: 'API failed' };

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    let items: any[] = [];
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
      items = JSON.parse(cleaned);
    } catch { items = []; }

    return {
      text: content,
      items: items.map((i: any) => ({ medicineName: i.medicineName || i.name || '', strength: i.strength })),
      confidence: items.length > 0 ? 0.8 : 0,
      provider: 'OPENAI',
    };
  } catch (e: any) {
    return { text: '', items: [], confidence: 0, provider: 'OPENAI', error: e.message };
  }
}
