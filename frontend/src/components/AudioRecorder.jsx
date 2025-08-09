import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { motion } from 'framer-motion';

const AudioRecorder = forwardRef(({ 
  isRecording, 
  onStart, 
  onStop, 
  disabled = false,
  autoStop = false,
  silenceDelay = 2000
}, ref) => {
  const [localIsRecording, setLocalIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const chunksRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);

  useImperativeHandle(ref, () => ({
    startRecording,
    stopRecording
  }));

  const detectSilence = (analyser) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkAudioLevel = () => {
      if (!localIsRecording || !analyserRef.current) return;
      
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);
      
      // Si autoStop está activado, detectar silencio
      if (autoStop) {
        if (average < 5) { // Umbral de silencio más sensible
          if (!silenceTimerRef.current) {
            console.log('Detectando silencio, iniciando timer...');
            silenceTimerRef.current = setTimeout(() => {
              console.log('Silencio detectado por 2 segundos, deteniendo grabación...');
              stopRecording();
            }, silenceDelay);
          }
        } else {
          // Si hay sonido, cancelar el timer de silencio
          if (silenceTimerRef.current) {
            console.log('Sonido detectado, cancelando timer de silencio');
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };
    
    checkAudioLevel();
  };

  const startRecording = async () => {
    if (disabled || localIsRecording) {
      return;
    }
    
    console.log('Iniciando grabación...');
    setLocalIsRecording(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      // Configurar analizador de audio para detección de silencio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      chunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        console.log('Grabación detenida, procesando audio...');
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Solo enviar si hay datos grabados
        if (blob.size > 0) {
          onStop(blob);
        }
        
        // Limpiar recursos
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        
        // Limpiar el analizador
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        analyserRef.current = null;
        setAudioLevel(0);
        setLocalIsRecording(false);
        setMediaRecorder(null);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      onStart();
      
      // Iniciar detección de silencio después de un pequeño retraso
      setTimeout(() => {
        if (analyserRef.current) {
          detectSilence(analyserRef.current);
        }
      }, 500);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
      setLocalIsRecording(false);
    }
  };

  const stopRecording = () => {
    console.log('Función stopRecording llamada');
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      console.log('Deteniendo MediaRecorder...');
      mediaRecorder.stop();
    }
  };

  useEffect(() => {
    return () => {
      // Limpieza al desmontar el componente
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Usar el estado local para determinar si está grabando
  const isCurrentlyRecording = localIsRecording || isRecording;

  return (
    <div className="relative">
      {!isCurrentlyRecording ? (
        <motion.button
          whileHover={!disabled ? { scale: 1.1 } : {}}
          whileTap={!disabled ? { scale: 0.9 } : {}}
          onClick={startRecording}
          disabled={disabled}
          className={`p-4 text-white rounded-full transition-colors shadow-lg ${
            disabled 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-french-red hover:bg-red-700 cursor-pointer'
          }`}
        >
          <Mic className="w-6 h-6" />
        </motion.button>
      ) : (
        <div className="relative">
          <motion.button
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            onClick={stopRecording}
            className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg relative"
          >
            <Square className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </motion.button>
          
          {/* Indicador de nivel de audio */}
          {autoStop && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-24 h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-green-400 to-green-600"
                animate={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                transition={{ duration: 0.05, ease: "linear" }}
              />
            </div>
          )}
        </div>
      )}
      
      {isCurrentlyRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-sm text-red-600 font-medium whitespace-nowrap"
        >
          {autoStop ? 'Habla... (se detendrá automáticamente)' : 'Grabando...'}
        </motion.div>
      )}
      
      {isCurrentlyRecording && autoStop && silenceTimerRef.current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -bottom-14 left-1/2 transform -translate-x-1/2 text-xs text-gray-500"
        >
          Detectando silencio...
        </motion.div>
      )}
    </div>
  );
});

AudioRecorder.displayName = 'AudioRecorder';

export default AudioRecorder;