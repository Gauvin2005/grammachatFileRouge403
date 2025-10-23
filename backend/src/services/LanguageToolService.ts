import axios from 'axios';
import { LanguageToolResponse, LanguageToolError, XPCalculationResult } from '../types';

export class LanguageToolService {
  private apiUrl: string;
  private apiKey?: string;

  constructor() {
    this.apiUrl = process.env.LANGUAGETOOL_API_URL || 'https://api.languagetool.org/v2/check';
    this.apiKey = process.env.LANGUAGETOOL_API_KEY;
  }

  /**
   * Vérifie l'orthographe et la grammaire d'un texte
   */
  async checkText(text: string, language = 'fr'): Promise<LanguageToolResponse> {
    try {
      const params = {
        text,
        language,
        enabledOnly: 'false',
        level: 'picky',
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await axios.post(this.apiUrl, new URLSearchParams(params), {
        headers,
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification LanguageTool:', error);
      throw new Error('Impossible de vérifier l\'orthographe du texte');
    }
  }

  /**
   * Calcule l'XP basé sur le texte et les erreurs trouvées
   */
  calculateXP(text: string, errors: LanguageToolError[]): XPCalculationResult {
    const xpPerCharacter = parseInt(process.env.XP_PER_CHARACTER || '1');
    const bonusNoErrors = parseInt(process.env.XP_BONUS_NO_ERRORS || '10');
    const penaltyPerError = parseInt(process.env.XP_PENALTY_PER_ERROR || '5');

    // XP de base basé sur le nombre de caractères
    const baseXP = Math.floor(text.length * xpPerCharacter);

    // Bonus si aucune erreur
    const bonusXP = errors.length === 0 ? bonusNoErrors : 0;

    // Pénalité pour chaque erreur
    const penaltyXP = errors.length * penaltyPerError;

    // XP total
    const totalXP = Math.max(0, baseXP + bonusXP - penaltyXP);

    return {
      baseXP,
      bonusXP,
      penaltyXP,
      totalXP,
      errorsCount: errors.length,
      levelUp: false, // Sera calculé par le modèle User
      newLevel: 0, // Sera calculé par le modèle User
    };
  }

  /**
   * Analyse un texte et retourne les erreurs avec calcul d'XP
   */
  async analyzeText(
    text: string,
    language = 'fr',
  ): Promise<{
    errors: LanguageToolError[];
    xpCalculation: XPCalculationResult;
  }> {
    // Si le texte est vide, retourner 0 XP
    if (!text || text.trim().length === 0) {
      return {
        errors: [],
        xpCalculation: {
          baseXP: 0,
          bonusXP: 0,
          penaltyXP: 0,
          totalXP: 0,
          errorsCount: 0,
          levelUp: false,
          newLevel: 1,
        },
      };
    }

    const response = await this.checkText(text, language);
    const xpCalculation = this.calculateXP(text, response.matches);

    return {
      errors: response.matches,
      xpCalculation,
    };
  }

  /**
   * Vérifie si le service LanguageTool est disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.checkText('test', 'fr');
      return true;
    } catch (error) {
      return false;
    }
  }
}
