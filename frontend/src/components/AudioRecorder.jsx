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
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const chunksRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useImperativeHandle(ref, () => ({
    startRecording,
    stopRecording
  }));

  const detectSilence = (analyser, stream) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkAudioLevel = () => {
      if (!mediaRecorder) return;
      
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);
      
      // Si autoStop está activado, detectar silencio
      if (autoStop) {
        if (average < 10) { // Umbral de silencio
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              stopRecording();
            }, silenceDelay);
          }
        } else {
          // Si hay sonido, cancelar el timer de silencio
          if (silenceTimerRef.current) {
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
    if (disabled) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Configurar analizador de audio para detección de silencio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
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
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onStop(blob);
        stream.getTracks().forEach(track => track.stop());
        
        // Limpiar el analizador
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioLevel(0);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      onStart();
      
      // Iniciar detección de silencio
      detectSilence(analyser, stream);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
    }
  };

  const stopRecording = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
  };

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      {!isRecording ? (
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
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-green-500"
                animate={{ width: `${Math.min(audioLevel / 2, 100)}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          )}
        </div>
      )}
      
      {isRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm text-red-600 font-medium"
        >
          {autoStop ? 'Hablando...' : 'Grabando...'}
        </motion.div>
      )}
    </div>
  );
});

AudioRecorder.displayName = 'AudioRecorder';

export default AudioRecorder;