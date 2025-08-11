import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import OpenAI from 'openai';
import http from 'http';
import { RealtimeService } from './services/realtimeService.js';
import { TextService } from './services/textService.js';
import { profileRoutes } from './routes/profiles.js';
import { exerciseRoutes } from './routes/exercises.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5002;
const TTS_VOICE = process.env.TTS_VOICE || 'ash';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/profiles', profileRoutes);
app.use('/api/exercises', exerciseRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'André 1.0 Backend' });
});

const wss = new WebSocketServer({ server });

const realtimeService = new RealtimeService(openai);
const textService = new TextService(openai);

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  let currentSession = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      switch(data.type) {
        case 'start_session':
          currentSession = await realtimeService.createSession(data.profile);
          
          // Agregar mensaje de bienvenida al contexto
          const welcomeMessage = `Bonjour ${data.profile.name}! Je suis André, ton tuteur de français. Comment vas-tu aujourd'hui?`;
          currentSession.conversation.push({
            role: 'assistant',
            content: welcomeMessage
          });
          
          ws.send(JSON.stringify({ 
            type: 'session_started', 
            sessionId: currentSession.id,
            welcomeMessage: welcomeMessage
          }));
          break;
          
        case 'audio_chunk':
          if (currentSession) {
            const response = await realtimeService.processAudio(
              currentSession.id, 
              data.audio
            );
            ws.send(JSON.stringify(response));
          }
          break;
          
        case 'text_message':
          if (currentSession) {
            const response = await textService.processText(
              currentSession,
              data.text
            );
            ws.send(JSON.stringify(response));
          }
          break;
          
        case 'generate_welcome_audio':
          try {
            const speech = await openai.audio.speech.create({
              model: 'tts-1',
              voice: TTS_VOICE,
              input: data.text,
              speed: 0.9
            });
            
            const audioBuffer = Buffer.from(await speech.arrayBuffer());
            ws.send(JSON.stringify({
              type: 'welcome_audio',
              audio: audioBuffer.toString('base64')
            }));
          } catch (error) {
            console.error('Error generating welcome audio:', error);
          }
          break;
          
        case 'end_session':
          if (currentSession) {
            await realtimeService.endSession(currentSession.id);
            currentSession = null;
          }
          break;
      }
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: error.message 
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    if (currentSession) {
      realtimeService.endSession(currentSession.id);
    }
  });
});

server.listen(PORT, () => {
  console.log(`André 1.0 Backend running on port ${PORT}`);
  console.log(`TTS voice: ${TTS_VOICE}`);
});