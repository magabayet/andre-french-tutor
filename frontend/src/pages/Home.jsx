import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Mic, Users, Brain } from 'lucide-react';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-4xl mx-auto"
      >
        <h1 className="text-6xl font-bold text-french-blue mb-4">
          André 1.0
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Tu tutor personal de francés con IA adaptativa
        </p>
        
        <div className="flex items-center justify-center gap-2 mb-12">
          <span className="text-3xl">🇫🇷</span>
          <span className="text-gray-500 text-lg">para</span>
          <span className="text-3xl">🇲🇽</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <Mic className="w-12 h-12 text-french-blue mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Conversación Real</h3>
            <p className="text-gray-600 text-sm">
              Practica hablando francés con retroalimentación instantánea
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <Users className="w-12 h-12 text-french-red mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Adaptado por Edad</h3>
            <p className="text-gray-600 text-sm">
              Contenido personalizado para estudiantes de 5 a 40 años
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <BookOpen className="w-12 h-12 text-french-blue mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Ejercicios Dinámicos</h3>
            <p className="text-gray-600 text-sm">
              Actividades interactivas adaptadas a tu nivel
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <Brain className="w-12 h-12 text-french-red mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">IA Avanzada</h3>
            <p className="text-gray-600 text-sm">
              Tecnología OpenAI para aprendizaje efectivo
            </p>
          </motion.div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/profile')}
          className="bg-french-blue text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-800 transition-colors shadow-lg"
        >
          Comenzar Ahora
        </motion.button>
      </motion.div>
    </div>
  );
}

export default Home;