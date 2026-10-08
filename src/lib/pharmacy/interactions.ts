import { prisma } from '@/lib/prisma';

export type InteractionSeverity = 'MINOR' | 'MODERATE' | 'MAJOR' | 'CONTRAINDICATED';

export interface InteractionWarning {
  drug1: string;
  drug2: string;
  severity: InteractionSeverity;
  description: string;
  recommendation?: string;
}

/**
 * Checks interactions between a list of medicine names.
 */
export async function checkInteractions(medicineNames: string[]): Promise<InteractionWarning[]> {
  if (medicineNames.length < 2) return [];

  const normalized = medicineNames.map((n) => n.trim().toLowerCase()).filter(Boolean);

  const interactions = await prisma.drugInteraction.findMany({
    where: {
      isActive: true,
      OR: normalized.flatMap((name) => [
        { drug1Name: { equals: name, mode: 'insensitive' as any } },
        { drug2Name: { equals: name, mode: 'insensitive' as any } },
      ]),
    },
  });

  const warnings: InteractionWarning[] = [];
  const seen = new Set<string>();

  for (const ix of interactions) {
    const n1 = ix.drug1Name.toLowerCase();
    const n2 = ix.drug2Name.toLowerCase();
    const has1 = normalized.includes(n1);
    const has2 = normalized.includes(n2);

    if (has1 && has2) {
      const key = [n1, n2].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      warnings.push({
        drug1: ix.drug1Name,
        drug2: ix.drug2Name,
        severity: ix.severity as InteractionSeverity,
        description: ix.description,
        recommendation: ix.recommendation || undefined,
      });
    }
  }

  // Sort by severity
  const order: Record<InteractionSeverity, number> = {
    CONTRAINDICATED: 0,
    MAJOR: 1,
    MODERATE: 2,
    MINOR: 3,
  };
  warnings.sort((a, b) => order[a.severity] - order[b.severity]);

  return warnings;
}

/**
 * Seeds common Bangladesh drug interactions.
 */
export async function seedCommonInteractions() {
  const common: Omit<InteractionWarning, 'recommendation'>[] & { recommendation?: string }[] = [
    { drug1: 'warfarin', drug2: 'aspirin', severity: 'MAJOR', description: 'Increased bleeding risk', recommendation: 'Avoid combination. Use alternative antiplatelet.' },
    { drug1: 'warfarin', drug2: 'ibuprofen', severity: 'MAJOR', description: 'Increased bleeding and GI risk', recommendation: 'Use paracetamol for pain instead.' },
    { drug1: 'metformin', drug2: 'alcohol', severity: 'MAJOR', description: 'Risk of lactic acidosis', recommendation: 'Avoid alcohol.' },
    { drug1: 'ciprofloxacin', drug2: 'antacid', severity: 'MODERATE', description: 'Reduced ciprofloxacin absorption', recommendation: 'Separate doses by 2 hours.' },
    { drug1: 'omeprazole', drug2: 'clopidogrel', severity: 'MAJOR', description: 'Reduced clopidogrel efficacy', recommendation: 'Use pantoprazole instead.' },
    { drug1: 'simvastatin', drug2: 'clarithromycin', severity: 'CONTRAINDICATED', description: 'Risk of rhabdomyolysis', recommendation: 'Use alternative antibiotic.' },
    { drug1: 'lisinopril', drug2: 'spironolactone', severity: 'MAJOR', description: 'Hyperkalemia risk', recommendation: 'Monitor potassium levels.' },
    { drug1: 'metronidazole', drug2: 'alcohol', severity: 'MAJOR', description: 'Disulfiram-like reaction', recommendation: 'Avoid alcohol for 3 days after treatment.' },
    { drug1: 'amoxicillin', drug2: 'methotrexate', severity: 'MODERATE', description: 'Increased methotrexate toxicity', recommendation: 'Monitor levels.' },
    { drug1: 'digoxin', drug2: 'furosemide', severity: 'MAJOR', description: 'Digoxin toxicity due to hypokalemia', recommendation: 'Monitor potassium and digoxin levels.' },
    { drug1: 'paracetamol', drug2: 'warfarin', severity: 'MODERATE', description: 'Enhanced anticoagulant effect', recommendation: 'Occasional use only, monitor INR.' },
    { drug1: 'cetirizine', drug2: 'diphenhydramine', severity: 'MINOR', description: 'Increased drowsiness', recommendation: 'Avoid driving.' },
    { drug1: 'tramadol', drug2: 'fluoxetine', severity: 'MAJOR', description: 'Serotonin syndrome risk', recommendation: 'Avoid combination.' },
    { drug1: 'prednisolone', drug2: 'ibuprofen', severity: 'MODERATE', description: 'Increased GI ulcer risk', recommendation: 'Add PPI if used together.' },
    { drug1: 'atenolol', drug2: 'verapamil', severity: 'MAJOR', description: 'Bradycardia and heart block risk', recommendation: 'Avoid combination.' },
  ];

  let created = 0;
  for (const ix of common) {
    const existing = await prisma.drugInteraction.findFirst({
      where: {
        drug1Name: { equals: ix.drug1, mode: 'insensitive' as any },
        drug2Name: { equals: ix.drug2, mode: 'insensitive' as any },
      },
    });
    if (!existing) {
      await prisma.drugInteraction.create({
        data: {
          drug1Name: ix.drug1,
          drug2Name: ix.drug2,
          severity: ix.severity as any,
          description: ix.description,
          recommendation: ix.recommendation || null,
          source: 'Tshastho Default Library',
        },
      });
      created++;
    }
  }

  return created;
}
