import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, MessageCircle, Gamepad2, Briefcase } from 'lucide-react';
import axios from 'axios';

function Exercises() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (!savedProfile) {
      navigate('/profile');
      return;
    }
    const profileData = JSON.parse(savedProfile);
    setProfile(profileData);
    loadExercises(profileData.age);
  }, [navigate]);

  const loadExercises = async (age) => {
    try {
      const response = await axios.get(`/api/exercises/by-age/${age}`);
      setExercises(response.data);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type) => {
    switch(type) {
      case 'vocabulary': return <BookOpen className="w-6 h-6" />;
      case 'conversation': return <MessageCircle className="w-6 h-6" />;
      case 'roleplay': return <Gamepad2 className="w-6 h-6" />;
      case 'professional': return <Briefcase className="w-6 h-6" />;
      default: return <BookOpen className="w-6 h-6" />;
    }
  };

  const renderExerciseContent = (exercise) => {
    switch(exercise.type) {
      case 'vocabulary':
        return (
          <div className="space-y-4">
            {exercise.content.words && (
              <div className="grid gap-3">
                {exercise.content.words.map((word, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xl font-semibold text-french-blue">{word.french}</p>
                        <p className="text-gray-600">{word.spanish}</p>
                      </div>
                      <p className="text-sm text-gray-500 italic">{word.pronunciation}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {exercise.content.practice && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-french-blue font-medium">Práctica:</p>
                <p className="mt-2">{exercise.content.practice}</p>
              </div>
            )}
          </div>
        );

      case 'conversation':
        return (
          <div className="space-y-4">
            {exercise.content.starter && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-green-800 font-medium mb-2">Para comenzar:</p>
                <p className="text-lg">{exercise.content.starter}</p>
              </div>
            )}
            {exercise.content.phrases && (
              <div className="space-y-3">
                {exercise.content.phrases.map((phrase, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium text-french-blue">{phrase.french}</p>
                    <p className="text-sm text-gray-600">{phrase.spanish}</p>
                    <p className="text-xs text-gray-500 italic mt-1">{phrase.pronunciation}</p>
                  </div>
                ))}
              </div>
            )}
            {exercise.content.vocabulary && (
              <div>
                <p className="font-medium mb-2">Vocabulario útil:</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.content.vocabulary.map((word, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {exercise.content.structures && (
              <div>
                <p className="font-medium mb-2">Estructuras:</p>
                <ul className="list-disc list-inside space-y-1">
                  {exercise.content.structures.map((structure, index) => (
                    <li key={index} className="text-gray-700">{structure}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'roleplay':
      case 'practical':
        return (
          <div className="space-y-4">
            {exercise.content.scenario && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-purple-800 font-medium mb-2">Escenario:</p>
                <p>{exercise.content.scenario}</p>
              </div>
            )}
            {exercise.content.situations && (
              <div>
                <p className="font-medium mb-3">Situaciones para practicar:</p>
                <div className="space-y-2">
                  {exercise.content.situations.map((situation, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-french-blue text-white rounded-full flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      <p>{situation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {exercise.content.questions && (
              <div>
                <p className="font-medium mb-3">Preguntas típicas:</p>
                <ul className="space-y-2">
                  {exercise.content.questions.map((question, index) => (
                    <li key={index} className="pl-4 border-l-2 border-french-blue">
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      default:
        return <div>Contenido del ejercicio</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-french-blue mx-auto"></div>
          <p className="mt-4">Cargando ejercicios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/session')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-french-blue">Ejercicios para {profile?.name}</h1>
          </div>
          <p className="text-gray-600">Ejercicios adaptados para {profile?.age} años</p>
        </header>

        {!selectedExercise ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exercises.map((exercise) => (
              <motion.div
                key={exercise.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedExercise(exercise)}
                className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-french-blue text-white rounded-lg">
                    {getIconForType(exercise.type)}
                  </div>
                  <h3 className="text-xl font-semibold">{exercise.title}</h3>
                </div>
                <p className="text-gray-600">{exercise.description}</p>
                <div className="mt-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {exercise.type === 'vocabulary' ? 'vocabulario' :
                     exercise.type === 'conversation' ? 'conversación' :
                     exercise.type === 'roleplay' ? 'juego de rol' :
                     exercise.type === 'professional' ? 'profesional' :
                     exercise.type === 'practical' ? 'práctico' :
                     exercise.type}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-french-blue">{selectedExercise.title}</h2>
              <button
                onClick={() => setSelectedExercise(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Volver
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">{selectedExercise.description}</p>
            
            {renderExerciseContent(selectedExercise)}
            
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => navigate('/session')}
                className="px-6 py-3 bg-french-blue text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                Practicar con André
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Exercises;