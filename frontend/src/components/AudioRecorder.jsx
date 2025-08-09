import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AudioRecorder = forwardRef(({ 
  isRecording, 
  onStart, 
  onStop, 
  disabled = false,
  autoStop = false,
  silenceDelay = 2500
}, ref) => {
  const [localRecording, setLocalRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Exponer métodos al componente padre
  useImperativeHandle(ref, () => ({
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording
  }));

  const analyzeAudio = () => {
    const analyser = analyserRef.current;
    if (!analyser || !mediaRecorderRef.current) {
      console.log('No hay analyser o mediaRecorder disponible');
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkLevel = () => {
      // Verificar que todavía estamos grabando
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
        console.log('MediaRecorder no está grabando, deteniendo análisis');
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      
      // Calcular el promedio del volumen
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      
      // Actualizar nivel de audio (normalizado 0-100)
      const normalizedLevel = Math.min(100, (average / 128) * 100);
      setAudioLevel(normalizedLevel);
      
      // Detección de silencio para auto-stop
      if (autoStop) {
        if (normalizedLevel < 3) { // Umbral de silencio muy bajo
          if (!silenceTimerRef.current) {
            console.log(`Silencio detectado (nivel: ${normalizedLevel.toFixed(2)}), iniciando timer...`);
            setIsListening(false);
            silenceTimerRef.current = setTimeout(() => {
              console.log('Auto-deteniendo por silencio prolongado');
              handleStopRecording();
            }, silenceDelay);
          }
        } else {
          // Hay sonido, cancelar timer de silencio
          if (silenceTimerRef.current) {
            console.log(`Sonido detectado (nivel: ${normalizedLevel.toFixed(2)}), cancelando timer`);
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
            setIsListening(true);
          } else if (!isListening && normalizedLevel > 5) {
            setIsListening(true);
          }
        }
      }
      
      // Continuar el análisis
      animationFrameRef.current = requestAnimationFrame(checkLevel);
    };
    
    // Iniciar el loop de análisis
    console.log('Iniciando análisis de audio...');
    checkLevel();
  };

  const handleStartRecording = async () => {
    if (disabled || localRecording) {
      console.log('No se puede iniciar: disabled=', disabled, 'localRecording=', localRecording);
      return;
    }

    console.log('Iniciando nueva grabación...');
    setLocalRecording(true);
    setIsListening(false);
    
    try {
      // Obtener acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      console.log('Stream de audio obtenido');
      streamRef.current = stream;

      // Crear analizador de audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512; // Más resolución
      analyser.smoothingTimeConstant = 0.4;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;
      console.log('Analizador de audio configurado');

      // Crear MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('Chunk de audio recibido:', event.data.size, 'bytes');
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder.onstop llamado');
        
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          console.log('Audio blob creado:', audioBlob.size, 'bytes');
          
          // Enviar el audio si tiene contenido significativo
          if (audioBlob.size > 1000) {
            console.log('Enviando audio al componente padre');
            onStop(audioBlob);
          } else {
            console.log('Audio muy corto, no se envía');
          }
        } else {
          console.log('No hay chunks de audio para procesar');
        }
        
        // Limpiar todo
        cleanup();
      };
      
      mediaRecorder.onerror = (error) => {
        console.error('Error en MediaRecorder:', error);
        cleanup();
      };

      mediaRecorder.onstart = () => {
        console.log('MediaRecorder.onstart - Grabación iniciada');
      };
      
      // Guardar referencia y empezar a grabar
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); // Capturar datos cada 250ms
      
      // Notificar al padre
      if (onStart) {
        onStart();
      }
      
      // Iniciar análisis de audio después de un pequeño delay
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          analyzeAudio();
        }
      }, 500);
      
      console.log('Grabación iniciada exitosamente');
      
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      alert('No se pudo acceder al micrófono. Verifica los permisos.');
      setLocalRecording(false);
      cleanup();
    }
  };

  const handleStopRecording = () => {
    console.log('handleStopRecording llamado');
    
    // Cancelar timer de silencio
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    // Cancelar análisis de audio
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Detener MediaRecorder
    if (mediaRecorderRef.current) {
      const state = mediaRecorderRef.current.state;
      console.log('Estado del MediaRecorder:', state);
      
      if (state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
          console.log('MediaRecorder.stop() llamado');
        } catch (error) {
          console.error('Error al detener MediaRecorder:', error);
        }
      } else {
        console.log('MediaRecorder no está grabando, limpiando...');
        cleanup();
      }
    } else {
      console.log('No hay MediaRecorder activo');
      setLocalRecording(false);
    }
  };

  const cleanup = () => {
    console.log('Limpiando recursos...');
    
    // Cancelar animación
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Cerrar stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Track de audio detenido');
      });
      streamRef.current = null;
    }
    
    // Cerrar audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().then(() => {
        console.log('AudioContext cerrado');
      });
      audioContextRef.current = null;
    }
    
    // Limpiar referencias y estado
    analyserRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setAudioLevel(0);
    setLocalRecording(false);
    setIsListening(false);
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      console.log('Componente desmontándose, limpiando...');
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      cleanup();
    };
  }, []);

  // No sincronizar automáticamente - dejar que el componente maneje su propio estado

  const showRecording = localRecording || isRecording;

  return (
    <div className="relative">
      {!showRecording ? (
        <motion.button
          whileHover={!disabled ? { scale: 1.1 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          onClick={handleStartRecording}
          disabled={disabled}
          className={`p-4 rounded-full shadow-lg transition-all ${
            disabled 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 cursor-pointer'
          }`}
        >
          <Mic className="w-6 h-6 text-white" />
        </motion.button>
      ) : (
        <div className="relative">
          <motion.button
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            }}
            onClick={handleStopRecording}
            className="p-4 bg-gradient-to-r from-red-600 to-red-700 rounded-full shadow-lg hover:from-red-700 hover:to-red-800 transition-all relative"
          >
            <Square className="w-6 h-6 text-white" />
            <motion.span 
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
            />
          </motion.button>
          
          {/* Visualizador de audio mejorado */}
          {autoStop && (
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-2 rounded-full transition-all ${
                      audioLevel > i * 20 
                        ? isListening 
                          ? 'bg-green-500' 
                          : 'bg-orange-500'
                        : 'bg-gray-300'
                    }`}
                    animate={{
                      height: audioLevel > i * 20 ? `${Math.min(24, 8 + (audioLevel - i * 20) * 0.8)}px` : '4px'
                    }}
                    transition={{ duration: 0.1 }}
                  />
                ))}
              </div>
              {/* Debug: Mostrar nivel actual */}
              <div className="text-xs text-gray-500 text-center mt-1">
                {audioLevel.toFixed(0)}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Indicadores de estado */}
      <AnimatePresence>
        {showRecording && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
          >
            <span className="text-sm font-medium text-red-600">
              {autoStop 
                ? isListening 
                  ? '🎤 Escuchando...' 
                  : '⏱️ Finalizando...'
                : '🔴 Grabando...'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Indicador de silencio */}
      <AnimatePresence>
        {showRecording && autoStop && !isListening && silenceTimerRef.current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 text-xs text-orange-600 font-medium"
          >
            Detectando silencio... (2.5s)
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

AudioRecorder.displayName = 'AudioRecorder';

export default AudioRecorder;