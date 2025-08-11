import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const AudioRecorder = forwardRef(({ 
  isRecording, 
  onStart, 
  onStop, 
  disabled = false,
  autoStop = false,
  silenceDelay = 2500,
  silenceThreshold = 10,
  relativeSilenceRatio = 0.18,
  showDebug = false
}, ref) => {
  const [localRecording, setLocalRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [hasSpoken, setHasSpoken] = useState(false);
  const [maxAudioLevel, setMaxAudioLevel] = useState(0);
  const [debugThreshold, setDebugThreshold] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastUiUpdateRef = useRef(0);
  const lastAboveThresholdRef = useRef(Date.now());

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

    const timeDomainArray = new Uint8Array(analyser.fftSize);
    const floatTimeArray = new Float32Array(analyser.fftSize);
    
    const checkLevel = () => {
      // Verificar que todavía estamos grabando
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
        console.log('MediaRecorder no está grabando, deteniendo análisis');
        return;
      }

      // Obtener datos en float y byte para robustez
      if (analyser.getFloatTimeDomainData) {
        analyser.getFloatTimeDomainData(floatTimeArray);
      } else {
        analyser.getByteTimeDomainData(timeDomainArray);
        for (let i = 0; i < timeDomainArray.length; i++) {
          floatTimeArray[i] = (timeDomainArray[i] - 128) / 128;
        }
      }
      
      // Calcular RMS y pico
      let sumSquares = 0;
      let peak = 0;
      for (let i = 0; i < floatTimeArray.length; i++) {
        const v = floatTimeArray[i];
        sumSquares += v * v;
        const abs = Math.abs(v);
        if (abs > peak) peak = abs;
      }
      const rms = Math.sqrt(sumSquares / floatTimeArray.length);
      
      // Nivel combinado para una UI sensible
      const levelFromRms = rms * 6000;   // factor alto para mics con señal baja
      const levelFromPeak = peak * 800;  // aporta reactividad instantánea
      const normalizedLevel = Math.min(100, Math.max(0, Math.max(levelFromRms, levelFromPeak)));
      
      // Actualizar nivel de audio (siempre, para una UI fluida)
      setAudioLevel(normalizedLevel);

      // Actualizar nivel máximo detectado
      if (normalizedLevel > maxAudioLevel) {
        setMaxAudioLevel(normalizedLevel);
      }
      
      // Marcar que el usuario ha hablado (umbral moderado para RMS)
      if (!hasSpoken && normalizedLevel > 6) {
        console.log('Usuario ha comenzado a hablar');
        setHasSpoken(true);
      }
      
      // Detección de silencio para auto-stop
      if (autoStop) {
        const dynamicThreshold = Math.max(silenceThreshold, maxAudioLevel * relativeSilenceRatio);
        // Actualización UI de debug (throttle ~120ms)
        const now = Date.now();
        if (now - lastUiUpdateRef.current > 120) {
          setDebugThreshold(dynamicThreshold);
          lastUiUpdateRef.current = now;
        }
        if (normalizedLevel < dynamicThreshold) { // Silencio relativo o absoluto
          // Verificación continua por tiempo de silencio desde el último pico
          const nowTs = Date.now();
          if (hasSpoken && nowTs - lastAboveThresholdRef.current >= silenceDelay) {
            console.log('Auto-deteniendo por silencio prolongado (medido por tiempo)');
            handleStopRecording();
          } else if (!silenceTimerRef.current && hasSpoken) {
            // Timer de respaldo
            console.log(`Silencio detectado (nivel: ${normalizedLevel.toFixed(2)} < thr: ${dynamicThreshold.toFixed(2)}), max nivel: ${maxAudioLevel.toFixed(2)}`);
            setIsListening(false);
            silenceTimerRef.current = setTimeout(() => {
              if (hasSpoken && maxAudioLevel > Math.max(6, silenceThreshold - 1)) {
                console.log('Auto-deteniendo por silencio prolongado (timer)');
                handleStopRecording();
              } else {
                silenceTimerRef.current = null;
              }
            }, silenceDelay);
          }
        } else {
          // Hay sonido, cancelar timer de silencio
          if (silenceTimerRef.current) {
            console.log(`Sonido detectado (nivel: ${normalizedLevel.toFixed(2)}), cancelando timer`);
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
            setIsListening(true);
          } else if (!isListening && normalizedLevel >= dynamicThreshold) {
            setIsListening(true);
          }
          // Registrar el último momento por encima del umbral
          lastAboveThresholdRef.current = Date.now();
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
    setHasSpoken(false);
    setMaxAudioLevel(0);
    
    try {
      // Obtener acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
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
    setHasSpoken(false);
    setMaxAudioLevel(0);
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
        <button
          onClick={handleStartRecording}
          disabled={disabled}
          className={`relative p-4 rounded-full transition-all ${
            disabled
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 shadow-lg'
          }`}
        >
          <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" aria-hidden="true"></span>
          <Mic className="relative w-6 h-6 text-white" />
        </button>
      ) : (
        <div className="relative">
          <button
            onClick={handleStopRecording}
            className="relative p-4 rounded-full bg-red-600 hover:bg-red-700 shadow-lg transition-all"
          >
            <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" aria-hidden="true"></span>
            <Square className="relative w-6 h-6 text-white" />
          </button>
          
          {/* Visualizador de audio mejorado */}
          {autoStop && (
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
              <div className="flex items-end gap-1 px-2 py-1 bg-white/60 backdrop-blur rounded-md border border-gray-200 min-h-[18px]">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-sm transition-[height,background-color] duration-100 ${
                      audioLevel > i * (100/12) 
                        ? isListening 
                          ? 'bg-green-500' 
                          : 'bg-orange-400'
                        : 'bg-gray-200'
                    }`}
                    style={{ height: audioLevel > i * (100/12) ? `${Math.min(32, 6 + (audioLevel - i * (100/12)) * 0.32)}px` : '4px' }}
                  />
                ))}
              </div>
          {/* Debug: nivel actual */}
          {showDebug && (
            <div className="text-[10px] text-gray-500 text-center mt-1">{audioLevel.toFixed(0)}</div>
          )}
            </div>
          )}
        </div>
      )}
      
      {/* Indicadores de estado */}
      <AnimatePresence>
        {showRecording && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium shadow ${
              autoStop ? (isListening ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700') : 'bg-red-100 text-red-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500' : 'bg-orange-500'}`} />
              {autoStop ? (isListening ? 'Escuchando...' : 'Finalizando...') : 'Grabando...'}
            </span>
          </div>
        )}
      </AnimatePresence>
      
      {/* Indicador de silencio */}
      <AnimatePresence>
        {showRecording && autoStop && !isListening && silenceTimerRef.current && (
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 shadow">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Detectando silencio... {(silenceDelay/1000).toFixed(1)}s
            </span>
          </div>
        )}
      </AnimatePresence>

      {/* Panel de depuración oculto por defecto */}
      {showDebug && (
        <AnimatePresence>
          {showRecording && autoStop && (
            <Motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute -bottom-28 left-1/2 transform -translate-x-1/2 text-[10px] bg-white/80 backdrop-blur px-2 py-1 rounded border border-gray-200 shadow-sm text-gray-700"
            >
              <div>lvl: {audioLevel.toFixed(1)} thr: {debugThreshold.toFixed(1)} max: {maxAudioLevel.toFixed(1)}</div>
              <div>spoke: {hasSpoken ? 'sí' : 'no'} listen: {isListening ? 'sí' : 'no'}</div>
            </Motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
});

AudioRecorder.displayName = 'AudioRecorder';

export default AudioRecorder;