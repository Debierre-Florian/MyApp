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

async function callClaude(messages: object[]): Promise<string> {
  if (!API_KEY || API_KEY === 'your_anthropic_api_key_here') {
    throw new Error('Clé API Anthropic manquante. Vérifie EXPO_PUBLIC_ANTHROPIC_API_KEY dans .env');
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
