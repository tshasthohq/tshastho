export interface ParsedVoiceInput {
  raw: string;
  medicineName: string;
  quantity: number;
  unit?: string;
  confidence: number;
}

export interface VoiceRecognitionOptions {
  language?: string; // 'bn-BD' or 'en-US'
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

// Bengali number words → digits
export const BENGALI_NUMBERS: Record<string, number> = {
  'শূন্য': 0, 'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4,
  'পাঁচ': 5, 'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'দশ': 10,
  'বিশ': 20, 'ত্রিশ': 30, 'চল্লিশ': 40, 'পঞ্চাশ': 50,
  'ষাট': 60, 'সত্তর': 70, 'আশি': 80, 'নব্বই': 90, 'একশ': 100,
  'একশত': 100, 'হাজার': 1000,
};

// Bengali unit words → unit
export const BENGALI_UNITS: Record<string, string> = {
  'পিস': 'piece', 'টুকরা': 'piece', 'প্যাকেট': 'pack',
  'বোতল': 'bottle', 'বাক্স': 'box', 'স্ট্রিপ': 'strip',
  'ট্যাবলেট': 'tablet', 'ক্যাপসুল': 'capsule', 'কার্টন': 'carton',
};
