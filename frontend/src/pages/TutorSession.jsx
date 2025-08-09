import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Send, BookOpen, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import AudioRecorder from '../components/AudioRecorder';
import MessageBubble from '../components/MessageBubble';

function TutorSession() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [autoRecord, setAutoRecord] = useState(true); // Activar grabación automática
  const autoRecordTimeoutRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const currentAudio = useRef(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (!savedProfile) {
      navigate('/profile');
      return;
    }
    setProfile(JSON.parse(savedProfile));
    
    // Solo conectar si no hay conexión activa
    if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
      connectWebSocket();
    }

    return () => {
      // Limpiar timeouts al desmontar
      if (autoRecordTimeoutRef.current) {
        clearTimeout(autoRecordTimeoutRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const connectWebSocket = () => {
    // Evitar múltiples conexiones
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      return;
    }
    
    ws.current = new WebSocket('ws://localhost:5002');
    
    ws.current.onopen = async () => {
      setIsConnected(true);
      const savedProfile = JSON.parse(localStorage.getItem('userProfile'));
      
      // Enviar solicitud de inicio de sesión
      ws.current.send(JSON.stringify({
        type: 'start_session',
        profile: savedProfile
      }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'session_started') {
        // Mensaje de bienvenida desde el servidor
        const welcomeText = data.welcomeMessage;
        setMessages([{
          id: Date.now(),
          type: 'assistant',
          text: welcomeText,
          timestamp: new Date(),
          isWelcome: true
        }]);
        
        // Generar audio para el mensaje de bienvenida
        ws.current.send(JSON.stringify({
          type: 'generate_welcome_audio',
          text: welcomeText
        }));
      } else if (data.type === 'welcome_audio') {
        // Actualizar el mensaje de bienvenida con audio
        setMessages(prev => prev.map(msg => 
          msg.isWelcome ? { ...msg, audio: data.audio } : msg
        ));
        if (data.audio) {
          playAudio(data.audio);
        }
      } else if (data.type === 'audio_response' || data.type === 'text_response') {
        if (data.userTranscript) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'user',
            text: data.userTranscript,
            timestamp: new Date()
          }]);
        }
        
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'assistant',
          text: data.transcript,
          audio: data.audio,
          corrections: data.corrections,
          timestamp: new Date()
        }]);
        
        if (data.audio) {
          playAudio(data.audio);
        }
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Error de conexión');
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      // Solo reconectar si había una conexión previa exitosa
      if (ws.current && ws.current.readyState === WebSocket.CLOSED) {
        setTimeout(() => {
          if (!isConnected && profile) {
            console.log('Intentando reconectar...');
            connectWebSocket();
          }
        }, 2000);
      }
    };
  };

  const playAudio = (audioBase64) => {
    // Detener audio anterior si existe
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }
    
    const audio = new Audio(`data:audio/webm;base64,${audioBase64}`);
    currentAudio.current = audio;
    setIsPlayingAudio(true);
    
    audio.addEventListener('ended', () => {
      setIsPlayingAudio(false);
      currentAudio.current = null;
      
      // Iniciar grabación automática después de que termine el audio
      if (autoRecord && audioRecorderRef.current && !isRecording) {
        // Limpiar cualquier timeout anterior
        if (autoRecordTimeoutRef.current) {
          clearTimeout(autoRecordTimeoutRef.current);
        }
        
        autoRecordTimeoutRef.current = setTimeout(() => {
          if (!isRecording && !isPlayingAudio) {
            console.log('Iniciando grabación automática...');
            audioRecorderRef.current.startRecording();
          }
        }, 800); // Esperar 800ms antes de empezar a grabar
      }
    });
    
    audio.addEventListener('error', () => {
      setIsPlayingAudio(false);
      currentAudio.current = null;
    });
    
    audio.play().catch(e => {
      console.error('Error playing audio:', e);
      setIsPlayingAudio(false);
      currentAudio.current = null;
    });
  };

  const handleAudioData = (audioBlob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result.split(',')[1];
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'audio_chunk',
          audio: base64Audio
        }));
      }
    };
    reader.readAsDataURL(audioBlob);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: textInput,
      timestamp: new Date()
    }]);
    
    ws.current.send(JSON.stringify({
      type: 'text_message',
      text: textInput
    }));
    
    setTextInput('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Home className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-french-blue">André 1.0</h1>
              {profile && (
                <p className="text-sm text-gray-600">
                  Sesión de {profile.name} ({profile.age} años)
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/exercises')}
              className="flex items-center gap-2 px-4 py-2 bg-french-blue text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              Ejercicios
            </button>
            
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col">
        <div className="flex-1 bg-white rounded-xl shadow-lg p-6 mb-4 overflow-y-auto">
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <AudioRecorder
                ref={audioRecorderRef}
                isRecording={isRecording}
                disabled={isPlayingAudio}
                autoStop={true} // Activar parada automática por silencio
                silenceDelay={2000} // Parar después de 2 segundos de silencio
                onStart={() => {
                  console.log('Grabación iniciada');
                  setIsRecording(true);
                  // Limpiar timeouts anteriores
                  if (autoRecordTimeoutRef.current) {
                    clearTimeout(autoRecordTimeoutRef.current);
                    autoRecordTimeoutRef.current = null;
                  }
                }}
                onStop={(blob) => {
                  console.log('Grabación detenida, procesando blob de', blob.size, 'bytes');
                  setIsRecording(false);
                  if (blob && blob.size > 1000) {
                    handleAudioData(blob);
                  }
                }}
              />
              {isPlayingAudio && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs whitespace-nowrap">
                  André está hablando...
                </div>
              )}
            </div>
            
            <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Escribe en francés..."
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-french-blue focus:outline-none"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="px-4 py-2 bg-french-blue text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </form>
          </div>
          
          <div className="mt-3 space-y-2">
            <div className="text-center text-sm text-gray-500">
              Habla en francés y André te ayudará con la gramática
            </div>
            <div className="flex items-center justify-center gap-2">
              <input
                type="checkbox"
                id="autoRecord"
                checked={autoRecord}
                onChange={(e) => setAutoRecord(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="autoRecord" className="text-sm text-gray-600">
                Grabación automática después de cada respuesta
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorSession;