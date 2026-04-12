import * as FileSystem from 'expo-file-system';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecipeStep {
  step: number;
  instruction: string;
}

export interface Recipe {
  name: string;
  time: string;
  difficulty: 'Très facile' | 'Facile' | 'Moyen' | 'Difficile';
  emoji: string;
  description: string;
  ingredients: string[];
  steps: RecipeStep[];
}

export interface AnalyseResult {
  detectedIngredients: string[];
  recipes: Recipe[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-4-6';
const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

const SYSTEM_PROMPT = `Tu es un assistant culinaire expert. Tu analyses les ingrédients disponibles et proposes des recettes adaptées.
Tu réponds TOUJOURS en JSON pur, sans markdown, sans bloc de code, sans texte avant ou après. Uniquement le JSON.`;

const buildUserPrompt = (ingredientText: string) => `
Voici les ingrédients disponibles : ${ingredientText}

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "detectedIngredients": ["ingrédient1", "ingrédient2"],
  "recipes": [
    {
      "name": "Nom de la recette",
      "time": "XX min",
      "difficulty": "Facile",
      "emoji": "🍳",
      "description": "Courte description appétissante en 1 phrase.",
      "ingredients": ["ingrédient1", "ingrédient2"],
      "steps": [
        { "step": 1, "instruction": "Première étape." },
        { "step": 2, "instruction": "Deuxième étape." }
      ]
    }
  ]
}

Propose exactement 3 recettes. La difficulté doit être l'une de : "Très facile", "Facile", "Moyen", "Difficile".
`.trim();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function toBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64' as const,
  });
  return base64;
}

function parseClaudeResponse(text: string): AnalyseResult {
  // Strip any accidental markdown fences
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const parsed = JSON.parse(clean) as AnalyseResult;

  if (!Array.isArray(parsed.detectedIngredients) || !Array.isArray(parsed.recipes)) {
    throw new Error('Structure JSON inattendue reçue de Claude.');
  }
  if (parsed.recipes.length === 0) {
    throw new Error('Aucune recette retournée par Claude.');
  }

  return parsed;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_RESULT: AnalyseResult = {
  detectedIngredients: ['tomates', 'pâtes', 'œuf', 'fromage', 'basilic'],
  recipes: [
    {
      name: 'Spaghetti à la carbonara express',
      time: '20 min',
      difficulty: 'Facile',
      emoji: '🍝',
      description: 'Un classique italien crémeux préparé en un clin d\'œil avec les ingrédients du frigo.',
      ingredients: ['pâtes', 'œuf', 'fromage', 'basilic'],
      steps: [
        { step: 1, instruction: 'Faire cuire les pâtes dans une grande casserole d\'eau bouillante salée selon les indications du paquet.' },
        { step: 2, instruction: 'Dans un bol, battre les œufs avec le fromage râpé et une pincée de poivre.' },
        { step: 3, instruction: 'Égoutter les pâtes en réservant une louche d\'eau de cuisson.' },
        { step: 4, instruction: 'Hors du feu, mélanger les pâtes avec le mélange œuf-fromage en ajoutant un peu d\'eau de cuisson pour une sauce crémeuse.' },
        { step: 5, instruction: 'Servir aussitôt, garni de basilic frais et d\'un tour de moulin à poivre.' },
      ],
    },
    {
      name: 'Bruschetta aux tomates et basilic',
      time: '15 min',
      difficulty: 'Très facile',
      emoji: '🍅',
      description: 'Une entrée fraîche et colorée qui met en valeur la douceur des tomates mûres.',
      ingredients: ['tomates', 'basilic', 'fromage'],
      steps: [
        { step: 1, instruction: 'Couper les tomates en petits dés et les déposer dans un saladier.' },
        { step: 2, instruction: 'Ajouter le basilic ciselé, une pincée de sel et un filet d\'huile d\'olive.' },
        { step: 3, instruction: 'Faire griller des tranches de pain au four ou à la poêle jusqu\'à ce qu\'elles soient dorées.' },
        { step: 4, instruction: 'Répartir la préparation aux tomates sur le pain grillé.' },
        { step: 5, instruction: 'Parsemer de fromage râpé ou en copeaux et servir immédiatement.' },
      ],
    },
    {
      name: 'Frittata tomates-fromage',
      time: '25 min',
      difficulty: 'Facile',
      emoji: '🍳',
      description: 'Une omelette italienne épaisse et dorée, parfaite pour un dîner rapide et nourrissant.',
      ingredients: ['œuf', 'tomates', 'fromage', 'basilic'],
      steps: [
        { step: 1, instruction: 'Préchauffer le four à 180 °C. Couper les tomates en rondelles.' },
        { step: 2, instruction: 'Battre les œufs dans un bol avec du sel, du poivre et la moitié du fromage râpé.' },
        { step: 3, instruction: 'Faire chauffer une poêle allant au four avec un filet d\'huile d\'olive à feu moyen.' },
        { step: 4, instruction: 'Verser les œufs battus et disposer les rondelles de tomates par-dessus.' },
        { step: 5, instruction: 'Parsemer du reste de fromage, puis enfourner 10 minutes jusqu\'à ce que la frittata soit prise et légèrement dorée. Garnir de basilic avant de servir.' },
      ],
    },
  ],
};

// ─── API call ─────────────────────────────────────────────────────────────────

const isMockMode = !API_KEY || API_KEY === 'your_anthropic_api_key_here';

async function callClaude(messages: object[]): Promise<string> {
  if (isMockMode) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return JSON.stringify(MOCK_RESULT);
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Erreur API Anthropic (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  const textBlock = data.content.find((c) => c.type === 'text');
  if (!textBlock) {
    throw new Error('Réponse Claude vide ou inattendue.');
  }

  return textBlock.text;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Analyse un frigo via une photo ou un texte d'ingrédients.
 * Retourne une liste d'ingrédients détectés et 3 recettes suggérées.
 */
export async function analysePhoto(params: {
  photoUri?: string;
  ingredientText?: string;
}): Promise<AnalyseResult> {
  const { photoUri, ingredientText } = params;

  let messages: object[];

  if (photoUri) {
    // ── Vision: send image as base64 ──────────────────────────────────────
    const base64 = await toBase64(photoUri);
    const mediaType = photoUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    messages = [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: 'text',
            text: buildUserPrompt('tous les ingrédients visibles sur cette photo de frigo'),
          },
        ],
      },
    ];
  } else if (ingredientText?.trim()) {
    // ── Text: list of ingredients ─────────────────────────────────────────
    messages = [
      {
        role: 'user',
        content: buildUserPrompt(ingredientText.trim()),
      },
    ];
  } else {
    throw new Error('Fournis une photo ou un texte d\'ingrédients.');
  }

  const rawText = await callClaude(messages);
  return parseClaudeResponse(rawText);
}
