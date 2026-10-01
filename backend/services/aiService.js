/**
 * 5 Pre-designed distinct themes matching requirements
 */
export const BASE_THEMES = [
  {
    id: 'modern_professional',
    name: 'Modern Professional',
    description: 'Clean geometry, contemporary sapphire & slate accents, modern typography.',
    category: 'Corporate / Conferences',
    primaryColor: '#1e40af',
    secondaryColor: '#0f172a',
    accentColor: '#3b82f6',
    textColor: '#0f172a',
    fontHeading: 'HelveticaBold',
    fontBody: 'Helvetica',
    borderStyle: 'double-geometric',
    badgeType: 'verified-shield',
    sampleWatermark: 'VERIFIED CREDENTIAL',
  },
  {
    id: 'elegant_academic',
    name: 'Elegant Academic',
    description: 'Traditional parchment tone, gold leaf borders, serif classical styling for universities.',
    category: 'Colleges & Universities',
    primaryColor: '#78350f',
    secondaryColor: '#451a03',
    accentColor: '#d97706',
    textColor: '#1c1917',
    fontHeading: 'TimesRomanBold',
    fontBody: 'TimesRoman',
    borderStyle: 'ornate-filigree',
    badgeType: 'academic-seal',
    sampleWatermark: 'HONORS CONFERRED',
  },
  {
    id: 'tech_futuristic',
    name: 'Technology & Futuristic',
    description: 'Emerald and cyan matrix styling, sharp tech borders, ideal for hackathons and coding summits.',
    category: 'Hackathons & Tech Summits',
    primaryColor: '#047857',
    secondaryColor: '#022c22',
    accentColor: '#10b981',
    textColor: '#064e3b',
    fontHeading: 'HelveticaBold',
    fontBody: 'Courier',
    borderStyle: 'circuit-grid',
    badgeType: 'digital-chip',
    sampleWatermark: 'GLOBAL HACKATHON INNOVATOR',
  },
  {
    id: 'minimal_corporate',
    name: 'Minimal Corporate',
    description: 'Monochrome elegance, high whitespace, ultra-sharp executive presentation.',
    category: 'Executive & Seminars',
    primaryColor: '#334155',
    secondaryColor: '#0f172a',
    accentColor: '#64748b',
    textColor: '#0f172a',
    fontHeading: 'HelveticaBold',
    fontBody: 'Helvetica',
    borderStyle: 'single-sharp',
    badgeType: 'minimal-star',
    sampleWatermark: 'LEADERSHIP EXCELLENCE',
  },
  {
    id: 'creative_competition',
    name: 'Creative Competition',
    description: 'Vibrant violet and rose accents, dynamic badges, perfect for clubs and competitions.',
    category: 'Clubs, Arts & Competitions',
    primaryColor: '#6d28d9',
    secondaryColor: '#2e1065',
    accentColor: '#f43f5e',
    textColor: '#1e1b4b',
    fontHeading: 'TimesRomanBold',
    fontBody: 'Helvetica',
    borderStyle: 'dynamic-duotone',
    badgeType: 'winner-rosette',
    sampleWatermark: 'PREMIER HONORS',
  }
];

// Color variations for regeneration
const COLOR_VARIATIONS = {
  modern_professional: [
    { primaryColor: '#1e40af', accentColor: '#3b82f6', secondaryColor: '#0f172a' },
    { primaryColor: '#0369a1', accentColor: '#0284c7', secondaryColor: '#082f49' },
    { primaryColor: '#1d4ed8', accentColor: '#60a5fa', secondaryColor: '#172554' },
    { primaryColor: '#2563eb', accentColor: '#38bdf8', secondaryColor: '#0f172a' },
  ],
  elegant_academic: [
    { primaryColor: '#78350f', accentColor: '#d97706', secondaryColor: '#451a03' },
    { primaryColor: '#854d0e', accentColor: '#eab308', secondaryColor: '#422006' },
    { primaryColor: '#713f12', accentColor: '#ca8a04', secondaryColor: '#3f2c00' },
    { primaryColor: '#92400e', accentColor: '#f59e0b', secondaryColor: '#451a03' },
  ],
  tech_futuristic: [
    { primaryColor: '#047857', accentColor: '#10b981', secondaryColor: '#022c22' },
    { primaryColor: '#0f766e', accentColor: '#14b8a6', secondaryColor: '#042f2e' },
    { primaryColor: '#059669', accentColor: '#34d399', secondaryColor: '#064e3b' },
    { primaryColor: '#0d9488', accentColor: '#2dd4bf', secondaryColor: '#134e4a' },
  ],
  minimal_corporate: [
    { primaryColor: '#334155', accentColor: '#64748b', secondaryColor: '#0f172a' },
    { primaryColor: '#1e293b', accentColor: '#475569', secondaryColor: '#020617' },
    { primaryColor: '#374151', accentColor: '#9ca3af', secondaryColor: '#111827' },
    { primaryColor: '#27272a', accentColor: '#71717a', secondaryColor: '#09090b' },
  ],
  creative_competition: [
    { primaryColor: '#6d28d9', accentColor: '#f43f5e', secondaryColor: '#2e1065' },
    { primaryColor: '#7c3aed', accentColor: '#ec4899', secondaryColor: '#3b0764' },
    { primaryColor: '#9333ea', accentColor: '#fb7185', secondaryColor: '#581c87' },
    { primaryColor: '#4c1d95', accentColor: '#e11d48', secondaryColor: '#2e1065' },
  ],
};

/**
 * Generate 5 Certificate Design Suggestions (with multiple regeneration support)
 */
export async function generateCertificateSuggestions({ eventTitle, organization, category, type, primaryColor, seed }) {
  const variationIndex = typeof seed === 'number' ? Math.abs(seed) : Math.floor(Math.random() * 4);

  const suggestions = BASE_THEMES.map(theme => {
    const themeVars = COLOR_VARIATIONS[theme.id] || [theme];
    const pickedVar = themeVars[variationIndex % themeVars.length];

    let adaptedPrimary = pickedVar.primaryColor;
    if (primaryColor && theme.id === 'modern_professional' && !seed) {
      adaptedPrimary = primaryColor;
    }

    return {
      ...theme,
      primaryColor: adaptedPrimary,
      accentColor: pickedVar.accentColor,
      secondaryColor: pickedVar.secondaryColor,
      titleSuggestion: `${eventTitle} Credential of Completion`,
      sampleRecipient: 'Jane Doe',
      sampleNarrative: `for exemplary contribution and completion of ${eventTitle}, hosted by ${organization || 'the organizer'}.`,
      reasoning: `Tailored for ${category || 'events'} in ${theme.name.toLowerCase()} style.`,
      variationIndex,
    };
  });

  return suggestions;
}
