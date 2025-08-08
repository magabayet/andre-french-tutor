import { motion } from 'framer-motion';
import { Volume2, CheckCircle, AlertCircle } from 'lucide-react';

function MessageBubble({ message }) {
  const isUser = message.type === 'user';

  const playAudio = () => {
    if (message.audio) {
      const audio = new Audio(`data:audio/webm;base64,${message.audio}`);
      audio.play().catch(e => console.error('Error playing audio:', e));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-french-blue text-white rounded-br-none'
              : 'bg-white text-gray-800 rounded-bl-none shadow-md'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.text}</p>
          
          {message.corrections && message.corrections.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Correcciones:</span>
              </div>
              {message.corrections.map((correction, index) => (
                <div key={index} className="text-sm bg-blue-50 text-blue-800 p-2 rounded mt-1">
                  <CheckCircle className="inline w-3 h-3 mr-1" />
                  {correction.correct}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          
          {message.audio && (
            <button
              onClick={playAudio}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <Volume2 className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>
      
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'order-1 mr-3 bg-gray-300' : 'order-2 ml-3 bg-french-blue'
      }`}>
        <span className="text-white text-sm font-bold">
          {isUser ? message.type[0].toUpperCase() : 'A'}
        </span>
      </div>
    </motion.div>
  );
}

export default MessageBubble;