export const commonSpanishSpeakerErrors = {
  pronunciation: [
    { 
      error: 'je suis', 
      commonMistake: ['ye suis', 'che suis', 'je souis'],
      correction: 'zhuh swee',
      explanation: 'La "j" francesa se pronuncia como "zh", no como "y" española'
    },
    {
      error: 'bonjour',
      commonMistake: ['bonyor', 'bonchour', 'bonjur'],
      correction: 'bon-ZHOOR',
      explanation: 'La "j" es suave como "zh" y la "ou" suena como "u" española'
    },
    {
      error: 'comment',
      commonMistake: ['coment', 'comman'],
      correction: 'co-MAHN',
      explanation: 'La "en" es nasal, no se pronuncia la "n" final'
    },
    {
      error: 'français',
      commonMistake: ['frances', 'fransais'],
      correction: 'frahn-SEH',
      explanation: 'La "an" es nasal y la "ç" suena como "s"'
    },
    {
      error: 'très',
      commonMistake: ['tres', 'trés'],
      correction: 'TREH',
      explanation: 'La "è" es abierta y no se pronuncia la "s" final'
    },
    {
      error: 'beaucoup',
      commonMistake: ['bocú', 'beaucup', 'bocup'],
      correction: 'bo-COO',
      explanation: 'La "eau" suena como "o" y la "ou" como "u" española'
    }
  ],
  
  grammar: [
    {
      error: 'género de palabras',
      example: 'le table (incorrecto)',
      correction: 'la table',
      explanation: 'En francés, "table" es femenino, no masculino'
    },
    {
      error: 'uso del subjuntivo',
      example: 'Il faut que je vais (incorrecto)',
      correction: 'Il faut que j\'aille',
      explanation: 'Después de "il faut que" se usa subjuntivo'
    },
    {
      error: 'concordancia de adjetivos',
      example: 'Elle est content (incorrecto)',
      correction: 'Elle est contente',
      explanation: 'Los adjetivos concuerdan en género y número'
    }
  ],
  
  vocabulary: [
    {
      spanish: 'embarazada',
      falseriend: 'embarrassée',
      correct: 'enceinte',
      explanation: '"Embarrassée" significa avergonzada, no embarazada'
    },
    {
      spanish: 'éxito',
      falseriend: 'exit',
      correct: 'succès',
      explanation: '"Exit" significa salida en inglés, usa "succès" para éxito'
    },
    {
      spanish: 'realizar',
      falseriend: 'réaliser',
      correct: 'faire/effectuer',
      explanation: '"Réaliser" significa darse cuenta, no realizar'
    }
  ]
};

export function detectPronunciationError(transcribedText, expectedText) {
  const normalized = transcribedText.toLowerCase().trim();
  const expected = expectedText.toLowerCase().trim();
  
  for (const errorPattern of commonSpanishSpeakerErrors.pronunciation) {
    for (const mistake of errorPattern.commonMistake) {
      if (normalized.includes(mistake)) {
        return {
          detected: true,
          error: errorPattern.error,
          correction: errorPattern.correction,
          explanation: errorPattern.explanation
        };
      }
    }
  }
  
  // Detección básica de similitud
  if (normalized !== expected && similarityScore(normalized, expected) < 0.7) {
    return {
      detected: true,
      error: 'pronunciación general',
      correction: expected,
      explanation: 'La pronunciación necesita mejorar'
    };
  }
  
  return { detected: false };
}

function similarityScore(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}