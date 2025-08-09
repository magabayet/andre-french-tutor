import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Calendar, ArrowRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

function ProfileSetup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !age) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const ageNum = parseInt(age);
    if (ageNum < 5) {
      toast.error('La edad mínima es 5 años');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/profiles/create', {
        name,
        age: ageNum
      });
      
      localStorage.setItem('userProfile', JSON.stringify(response.data));
      toast.success('¡Perfil creado exitosamente!');
      navigate('/session');
    } catch (error) {
      toast.error('Error al crear el perfil');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getAgeGroupMessage = () => {
    const ageNum = parseInt(age);
    if (!ageNum) return '';
    
    if (ageNum >= 5 && ageNum <= 10) {
      return 'Contenido divertido con juegos y canciones';
    } else if (ageNum >= 11 && ageNum <= 17) {
      return 'Temas modernos y conversaciones dinámicas';
    } else if (ageNum >= 18 && ageNum <= 25) {
      return 'Enfoque práctico para universidad y trabajo';
    } else if (ageNum >= 26 && ageNum <= 40) {
      return 'Contenido profesional y cultural avanzado';
    } else if (ageNum >= 41 && ageNum <= 60) {
      return 'Conversaciones sofisticadas y temas culturales';
    } else {
      return 'Práctica conversacional adaptada a tu experiencia';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        <h2 className="text-3xl font-bold text-french-blue mb-6 text-center">
          Crear tu Perfil
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              <User className="inline w-5 h-5 mr-2" />
              Tu Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-french-blue focus:outline-none transition-colors"
              placeholder="Ingresa tu nombre"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              <Calendar className="inline w-5 h-5 mr-2" />
              Tu Edad
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="5"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-french-blue focus:outline-none transition-colors"
              placeholder="Mínimo 5 años"
            />
            {age && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-gray-600 mt-2"
              >
                {getAgeGroupMessage()}
              </motion.p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-french-blue text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              'Creando perfil...'
            ) : (
              <>
                Comenzar a Aprender
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700 text-center">
            André adaptará automáticamente el contenido y la metodología según tu edad para una experiencia de aprendizaje óptima
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default ProfileSetup;