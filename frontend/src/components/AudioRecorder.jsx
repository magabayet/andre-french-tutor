import { useState, useRef } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { motion } from 'framer-motion';

function AudioRecorder({ isRecording, onStart, onStop, disabled = false }) {
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const chunksRef = useRef([]);

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
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      onStart();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
  };

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
        <motion.button
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          onClick={stopRecording}
          className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg relative"
        >
          <Square className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </motion.button>
      )}
      
      {isRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm text-red-600 font-medium"
        >
          Grabando...
        </motion.div>
      )}
    </div>
  );
}

export default AudioRecorder;