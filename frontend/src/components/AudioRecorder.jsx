import { useState, useRef, forwardRef, useImperativeHandle, useEffect, useCallback } from 'react';
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

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !localRecording) {
      setAudioLevel(0);
      return;
    }

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkLevel = () => {
      if (!analyserRef.current || !localRecording) {
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
        if (normalizedLevel < 5) { // Umbral de silencio
          if (!silenceTimerRef.current) {
            console.log('Iniciando timer de silencio...');
            setIsListening(false);
            silenceTimerRef.current = setTimeout(() => {
              console.log('Auto-deteniendo por silencio');
              handleStopRecording();
            }, silenceDelay);
          }
        } else {
          // Hay sonido, cancelar timer de silencio
          if (silenceTimerRef.current) {
            console.log('Sonido detectado, cancelando timer');
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
            setIsListening(true);
          }
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(checkLevel);
    };
    
    checkLevel();
  }, [localRecording, autoStop, silenceDelay]);

  const handleStartRecording = async () => {
    if (disabled || localRecording) {
      console.log('No se puede iniciar: disabled=', disabled, 'localRecording=', localRecording);
      return;
    }

    console.log('Iniciando nueva grabación...');
    
    try {
      // Obtener acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;

      // Crear analizador de audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      // Crear MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder detenido, procesando audio...');
        
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('Tamaño del audio:', audioBlob.size, 'bytes');
        
        // Enviar el audio si tiene contenido
        if (audioBlob.size > 500) {
          onStop(audioBlob);
        } else {
          console.log('Audio demasiado corto, no se envía');
        }
        
        // Limpiar
        cleanup();
      };
      
      mediaRecorder.onerror = (error) => {
        console.error('Error en MediaRecorder:', error);
        cleanup();
      };
      
      // Iniciar grabación
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Capturar datos cada 100ms
      
      setLocalRecording(true);
      setIsListening(true);
      onStart();
      
      // Iniciar análisis de audio
      setTimeout(() => {
        analyzeAudio();
      }, 100);
      
      console.log('Grabación iniciada exitosamente');
      
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      alert('No se pudo acceder al micrófono. Verifica los permisos.');
      cleanup();
    }
  };

  const handleStopRecording = () => {
    console.log('Deteniendo grabación...');
    
    // Cancelar timer de silencio
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    // Detener MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
        console.log('MediaRecorder detenido');
      } catch (error) {
        console.error('Error al detener MediaRecorder:', error);
      }
    }
    
    setLocalRecording(false);
    setIsListening(false);
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
      });
      streamRef.current = null;
    }
    
    // Cerrar audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Limpiar referencias
    analyserRef.current = null;
    mediaRecorderRef.current = null;
    setAudioLevel(0);
    setLocalRecording(false);
    setIsListening(false);
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      cleanup();
    };
  }, []);

  // Sincronizar con prop externa
  useEffect(() => {
    if (!isRecording && localRecording) {
      handleStopRecording();
    }
  }, [isRecording]);

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
                      height: audioLevel > i * 20 ? `${Math.min(20, audioLevel - i * 20)}px` : '4px'
                    }}
                    transition={{ duration: 0.1 }}
                  />
                ))}
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
            className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-xs text-orange-600 font-medium"
          >
            Detectando silencio...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

AudioRecorder.displayName = 'AudioRecorder';

export default AudioRecorder;