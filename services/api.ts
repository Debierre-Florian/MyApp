import * as FileSystem from 'expo-file-system';
import { UserPreferences } from '../hooks/usePreferences';

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

const SYSTEM_PROMPT = `Tu es un assistant culinaire expert. Tu analyses les ingrédients disponibles et proposes des recettes adaptées aux préférences de l'utilisateur.
Tu réponds TOUJOURS en JSON pur, sans markdown, sans bloc de code, sans texte avant ou après. Uniquement le JSON.`;

function buildPreferencesBlock(prefs?: UserPreferences): string {
  if (!prefs) return '';
  const lines: string[] = [];

  if (prefs.firstName) {
    lines.push(`Prénom de l'utilisateur : ${prefs.firstName}.`);
  }
  if (prefs.diet && prefs.diet !== 'Omnivore') {
    lines.push(`Régime alimentaire : ${prefs.diet}. Respecte impérativement ce régime dans toutes les recettes.`);
  }
  if (prefs.allergies.length > 0) {
    lines.push(`Allergies (à exclure absolument) : ${prefs.allergies.join(', ')}.`);
  }
  if (prefs.favoriteIngredients.length > 0) {
    lines.push(`Ingrédients favoris (à privilégier si possible) : ${prefs.favoriteIngredients.join(', ')}.`);
  }
  if (prefs.dislikedIngredients.length > 0) {
    lines.push(`Ingrédients détestés (à éviter) : ${prefs.dislikedIngredients.join(', ')}.`);
  }

  if (lines.length === 0) return '';
  return `\n\nPréférences de l'utilisateur :\n${lines.join('\n')}`;
}

const buildUserPrompt = (ingredientText: string, prefs?: UserPreferences) => `
Voici les ingrédients disponibles : ${ingredientText}${buildPreferencesBlock(prefs)}

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
  detectedIngredients: ['tomates', 'pâtes', 'œuf'],
  recipes: [
    {
      name: 'Spaghetti à la carbonara',
      time: '20 min',
      difficulty: 'Facile',
      emoji: '🍝',
      description: 'Un classique italien crémeux avec une sauce dorée aux lardons et parmesan.',
      ingredients: ['pâtes', 'œuf', 'lardons', 'parmesan', 'ail', 'poivre noir'],
      steps: [
        { step: 1, instruction: 'Faire cuire les pâtes dans une grande casserole d\'eau bouillante salée selon les indications du paquet.' },
        { step: 2, instruction: 'Faire revenir les lardons avec l\'ail émincé dans une poêle sans matière grasse jusqu\'à ce qu\'ils soient dorés.' },
        { step: 3, instruction: 'Dans un bol, battre les œufs avec le parmesan râpé et une généreuse pincée de poivre noir.' },
        { step: 4, instruction: 'Égoutter les pâtes en réservant une louche d\'eau de cuisson.' },
        { step: 5, instruction: 'Hors du feu, mélanger les pâtes chaudes avec les lardons puis verser le mélange œuf-parmesan en remuant rapidement. Ajouter un peu d\'eau de cuisson pour une sauce crémeuse.' },
      ],
    },
    {
      name: 'Sauce tomate à la crème',
      time: '25 min',
      difficulty: 'Très facile',
      emoji: '🍅',
      description: 'Des pâtes nappées d\'une sauce tomate onctueuse relevée à la crème fraîche et aux herbes.',
      ingredients: ['pâtes', 'tomates', 'crème fraîche', 'ail', 'huile d\'olive', 'basilic'],
      steps: [
        { step: 1, instruction: 'Faire revenir l\'ail émincé dans un filet d\'huile d\'olive à feu moyen pendant 1 minute.' },
        { step: 2, instruction: 'Ajouter les tomates coupées en dés, saler, poivrer et laisser mijoter 10 minutes à feu doux.' },
        { step: 3, instruction: 'Incorporer la crème fraîche et laisser réduire 3 minutes en remuant.' },
        { step: 4, instruction: 'Faire cuire les pâtes al dente dans une grande casserole d\'eau salée.' },
        { step: 5, instruction: 'Égoutter les pâtes, les mélanger à la sauce et garnir de basilic frais avant de servir.' },
      ],
    },
    {
      name: 'Frittata aux tomates et mozzarella',
      time: '20 min',
      difficulty: 'Facile',
      emoji: '🍳',
      description: 'Une omelette italienne épaisse et dorée, fondante avec la mozzarella et parfumée au basilic.',
      ingredients: ['œuf', 'tomates', 'mozzarella', 'basilic', 'huile d\'olive', 'sel', 'poivre'],
      steps: [
        { step: 1, instruction: 'Préchauffer le four à 180 °C. Couper les tomates en rondelles et la mozzarella en tranches.' },
        { step: 2, instruction: 'Battre les œufs dans un bol avec du sel et du poivre.' },
        { step: 3, instruction: 'Faire chauffer un filet d\'huile d\'olive dans une poêle allant au four à feu moyen.' },
        { step: 4, instruction: 'Verser les œufs battus et disposer les rondelles de tomates et les tranches de mozzarella par-dessus.' },
        { step: 5, instruction: 'Enfourner 10 minutes jusqu\'à ce que la frittata soit prise et dorée. Garnir de basilic frais et servir aussitôt.' },
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

// ─── Mock ticket data ─────────────────────────────────────────────────────────

const MOCK_TICKET_PRODUCTS = ['lait', 'beurre', 'carottes', 'pommes', 'yaourt', 'poulet', 'riz'];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Scanne un ticket de caisse via une photo et retourne la liste des produits détectés.
 */
export async function scanTicket(_photoUri: string): Promise<string[]> {
  if (isMockMode) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return MOCK_TICKET_PRODUCTS;
  }

  const base64 = await toBase64(_photoUri);
  const mediaType = _photoUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        },
        {
          type: 'text',
          text: `Voici la photo d'un ticket de caisse. Liste uniquement les noms des produits alimentaires détectés sur ce ticket, en minuscules, sans quantité ni marque. Réponds UNIQUEMENT avec ce JSON (sans markdown) : {"products": ["produit1", "produit2"]}`,
        },
      ],
    },
  ];

  const rawText = await callClaude(messages);
  const clean = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const parsed = JSON.parse(clean) as { products: string[] };
  if (!Array.isArray(parsed.products)) throw new Error('Réponse inattendue du serveur.');
  return parsed.products;
}

/**
 * Analyse un frigo via une photo ou un texte d'ingrédients.
 * Retourne une liste d'ingrédients détectés et 3 recettes suggérées.
 */
export async function analysePhoto(params: {
  photoUri?: string;
  ingredientText?: string;
  preferences?: UserPreferences;
}): Promise<AnalyseResult> {
  const { photoUri, ingredientText, preferences } = params;

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
            text: buildUserPrompt('tous les ingrédients visibles sur cette photo de frigo', preferences),
          },
        ],
      },
    ];
  } else if (ingredientText?.trim()) {
    // ── Text: list of ingredients ─────────────────────────────────────────
    messages = [
      {
        role: 'user',
        content: buildUserPrompt(ingredientText.trim(), preferences),
      },
    ];
  } else {
    throw new Error('Fournis une photo ou un texte d\'ingrédients.');
  }

  const rawText = await callClaude(messages);
  return parseClaudeResponse(rawText);
}
