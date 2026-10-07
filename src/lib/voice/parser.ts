import { BENGALI_NUMBERS, BENGALI_UNITS, ParsedVoiceInput } from './types';

/**
 * Parses Bengali or English voice input into medicine name + quantity.
 * Examples:
 *   "প্যারাসিটামল দুই পিস"       → { medicineName: 'প্যারাসিটামল', quantity: 2, unit: 'piece' }
 *   "Napa 500mg three pieces"   → { medicineName: 'Napa 500mg', quantity: 3, unit: 'piece' }
 *   "সেকলো একটা"                 → { medicineName: 'সেকলো', quantity: 1 }
 */
export function parseVoiceInput(text: string): ParsedVoiceInput {
  const cleaned = text.trim().toLowerCase();
  const result: ParsedVoiceInput = {
    raw: text,
    medicineName: text.trim(),
    quantity: 1,
    confidence: 0.5,
  };

  // 1. Extract Bengali digits
  const bengaliDigits = cleaned.match(/[০-৯]+/g);
  if (bengaliDigits) {
    const num = parseInt(
      bengaliDigits[0].replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))),
      10
    );
    if (!isNaN(num) && num > 0 && num <= 999) {
      result.quantity = num;
      result.confidence = 0.85;
    }
  } else {
    // 2. Extract English digits
    const englishDigits = cleaned.match(/\b(\d{1,3})\b/);
    if (englishDigits) {
      const num = parseInt(englishDigits[1], 10);
      if (num > 0 && num <= 999) {
        result.quantity = num;
        result.confidence = 0.85;
      }
    } else {
      // 3. Bengali number words
      for (const [word, num] of Object.entries(BENGALI_NUMBERS)) {
        if (cleaned.includes(word)) {
          result.quantity = num;
          result.confidence = 0.75;
          break;
        }
      }
    }
  }

  // 4. Extract unit
  for (const [word, unit] of Object.entries(BENGALI_UNITS)) {
    if (cleaned.includes(word)) {
      result.unit = unit;
      break;
    }
  }

  // 5. Extract medicine name (remove numbers, units, filler words)
  let name = text;

  // Remove digits (both Bengali and English)
  name = name.replace(/[০-৯]+/g, '');
  name = name.replace(/\b\d{1,3}\b/g, '');

  // Remove number words
  for (const word of Object.keys(BENGALI_NUMBERS)) {
    name = name.replace(new RegExp(word, 'g'), '');
  }

  // Remove unit words
  for (const word of Object.keys(BENGALI_UNITS)) {
    name = name.replace(new RegExp(word, 'g'), '');
  }

  // Remove common filler words (Bengali)
  const fillers = ['একটা', 'কিছু', 'আর', 'ও', 'এবং', 'এর', 'প্লিজ', 'please', 'pieces', 'piece', 'pcs', 'pcs.'];
  for (const filler of fillers) {
    name = name.replace(new RegExp(filler, 'gi'), '');
  }

  // Clean whitespace
  name = name.replace(/\s+/g, ' ').trim();

  if (name.length > 0) {
    result.medicineName = name;
    result.confidence = Math.min(0.95, result.confidence + 0.1);
  }

  return result;
}
