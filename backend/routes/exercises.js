import express from 'express';

const router = express.Router();

const exercisesByAge = {
  '5-10': [
    {
      id: 'colors',
      title: 'Les Couleurs',
      description: 'Aprende los colores en francés',
      type: 'vocabulary',
      content: {
        words: [
          { french: 'rouge', spanish: 'rojo', pronunciation: 'ruzh' },
          { french: 'bleu', spanish: 'azul', pronunciation: 'blö' },
          { french: 'vert', spanish: 'verde', pronunciation: 'vehr' },
          { french: 'jaune', spanish: 'amarillo', pronunciation: 'zhon' },
          { french: 'noir', spanish: 'negro', pronunciation: 'nwar' },
          { french: 'blanc', spanish: 'blanco', pronunciation: 'blan' }
        ],
        practice: "Dis-moi de quelle couleur est le ciel? Et le soleil?"
      }
    },
    {
      id: 'animals',
      title: 'Les Animaux',
      description: 'Animales comunes en francés',
      type: 'vocabulary',
      content: {
        words: [
          { french: 'le chat', spanish: 'el gato', pronunciation: 'lö sha' },
          { french: 'le chien', spanish: 'el perro', pronunciation: 'lö shyan' },
          { french: 'l\'oiseau', spanish: 'el pájaro', pronunciation: 'lwazo' },
          { french: 'le poisson', spanish: 'el pez', pronunciation: 'lö pwason' }
        ],
        practice: "Quel est ton animal préféré?"
      }
    },
    {
      id: 'greetings',
      title: 'Les Salutations',
      description: 'Saludos básicos',
      type: 'conversation',
      content: {
        phrases: [
          { french: 'Bonjour!', spanish: '¡Buenos días!', pronunciation: 'bonzhur' },
          { french: 'Comment tu t\'appelles?', spanish: '¿Cómo te llamas?', pronunciation: 'koman tü tapel' },
          { french: 'J\'ai ... ans', spanish: 'Tengo ... años', pronunciation: 'zhay ... an' }
        ]
      }
    }
  ],
  '11-17': [
    {
      id: 'daily_routine',
      title: 'Ma Routine Quotidienne',
      description: 'Describe tu día típico',
      type: 'conversation',
      content: {
        starter: "Raconte-moi ta journée typique. À quelle heure tu te lèves?",
        vocabulary: [
          'se lever', 'prendre le petit-déjeuner', 'aller à l\'école',
          'étudier', 'jouer', 'dîner', 'se coucher'
        ],
        structures: [
          'Je me lève à...',
          'Ensuite, je...',
          'L\'après-midi, je...',
          'Le soir, je...'
        ]
      }
    },
    {
      id: 'hobbies',
      title: 'Mes Loisirs',
      description: 'Habla sobre tus pasatiempos',
      type: 'conversation',
      content: {
        starter: "Qu'est-ce que tu aimes faire pendant ton temps libre?",
        vocabulary: [
          'jouer aux jeux vidéo', 'écouter de la musique', 'faire du sport',
          'lire', 'dessiner', 'sortir avec des amis'
        ]
      }
    },
    {
      id: 'school',
      title: 'À l\'École',
      description: 'Conversación sobre la escuela',
      type: 'conversation',
      content: {
        starter: "Quelle est ta matière préférée à l'école? Pourquoi?",
        vocabulary: [
          'les mathématiques', 'l\'histoire', 'les sciences',
          'l\'éducation physique', 'les langues', 'l\'art'
        ]
      }
    }
  ],
  '18-25': [
    {
      id: 'job_interview',
      title: 'Entretien d\'Embauche',
      description: 'Practica para una entrevista de trabajo',
      type: 'roleplay',
      content: {
        scenario: "Vous postulez pour un stage dans une entreprise française",
        questions: [
          "Parlez-moi de vous",
          "Pourquoi voulez-vous travailler chez nous?",
          "Quelles sont vos qualités et vos défauts?",
          "Où vous voyez-vous dans 5 ans?"
        ]
      }
    },
    {
      id: 'travel',
      title: 'Voyager en France',
      description: 'Situaciones de viaje',
      type: 'practical',
      content: {
        situations: [
          'Réserver une chambre d\'hôtel',
          'Commander au restaurant',
          'Demander des directions',
          'Acheter des billets de train'
        ]
      }
    },
    {
      id: 'social',
      title: 'Rencontres Sociales',
      description: 'Conversaciones sociales',
      type: 'conversation',
      content: {
        starter: "Vous rencontrez quelqu'un à une soirée. Présentez-vous et faites connaissance.",
        topics: [
          'Études ou travail',
          'Loisirs et intérêts',
          'Voyages et expériences',
          'Projets futurs'
        ]
      }
    }
  ],
  '26-40': [
    {
      id: 'business',
      title: 'Français des Affaires',
      description: 'Francés para negocios',
      type: 'professional',
      content: {
        scenarios: [
          'Présenter un projet',
          'Négocier un contrat',
          'Participer à une réunion',
          'Rédiger un email professionnel'
        ],
        vocabulary: [
          'le chiffre d\'affaires', 'la rentabilité', 'l\'objectif',
          'la stratégie', 'le partenariat', 'l\'investissement'
        ]
      }
    },
    {
      id: 'culture',
      title: 'Culture et Actualités',
      description: 'Discusión sobre temas actuales',
      type: 'discussion',
      content: {
        topics: [
          'L\'économie française',
          'La politique européenne',
          'Les innovations technologiques',
          'L\'environnement et le développement durable'
        ]
      }
    },
    {
      id: 'formal',
      title: 'Situations Formelles',
      description: 'Contextos formales y administrativos',
      type: 'practical',
      content: {
        situations: [
          'Ouvrir un compte bancaire',
          'Louer un appartement',
          'Démarches administratives',
          'Rendez-vous médical'
        ]
      }
    }
  ]
};

router.get('/by-age/:age', (req, res) => {
  const age = parseInt(req.params.age);
  
  let exercises = [];
  
  if (age >= 5 && age <= 10) {
    exercises = exercisesByAge['5-10'];
  } else if (age >= 11 && age <= 17) {
    exercises = exercisesByAge['11-17'];
  } else if (age >= 18 && age <= 25) {
    exercises = exercisesByAge['18-25'];
  } else if (age >= 26 && age <= 40) {
    exercises = exercisesByAge['26-40'];
  }
  
  res.json(exercises);
});

router.get('/:id', (req, res) => {
  let exercise = null;
  
  for (const ageGroup of Object.values(exercisesByAge)) {
    exercise = ageGroup.find(ex => ex.id === req.params.id);
    if (exercise) break;
  }
  
  if (!exercise) {
    return res.status(404).json({ error: 'Exercise not found' });
  }
  
  res.json(exercise);
});

export { router as exerciseRoutes };