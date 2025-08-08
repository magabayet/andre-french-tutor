import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { sessionStore } from './sessionStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class RealtimeService extends EventEmitter {
  constructor(openai) {
    super();
    this.openai = openai;
    this.sessions = new Map();
  }

  async createSession(profile) {
    const sessionId = this.generateSessionId();
    
    // Intentar recuperar sesión existente
    let existingSession = sessionStore.getSession(sessionId);
    if (existingSession && existingSession.profile.name === profile.name) {
      this.sessions.set(sessionId, existingSession);
      return existingSession;
    }
    
    const systemPrompt = this.generateSystemPrompt(profile);
    
    const session = {
      id: sessionId,
      profile,
      systemPrompt,
      conversation: [],
      startTime: new Date()
    };

    this.sessions.set(sessionId, session);
    sessionStore.saveSession(sessionId, session);
    return session;
  }

  generateSystemPrompt(profile) {
    const age = profile.age || 15;
    const name = profile.name || 'estudiante';
    
    let ageAdaptation = '';
    let exercises = '';
    
    if (age >= 5 && age <= 10) {
      ageAdaptation = `Eres un tutor amigable y paciente para niños. Usa un lenguaje simple, 
      ejemplos divertidos con animales y colores, y felicita mucho al estudiante. 
      Habla despacio y con claridad. Usa juegos y canciones cuando sea apropiado.`;
      exercises = `Ejercicios recomendados: contar del 1 al 10, nombrar colores, 
      animales, partes del cuerpo, saludos básicos.`;
    } else if (age >= 11 && age <= 17) {
      ageAdaptation = `Eres un tutor dinámico para adolescentes. Usa ejemplos modernos, 
      referencias a música, deportes y tecnología. Sé motivador pero no condescendiente.`;
      exercises = `Ejercicios recomendados: conversaciones sobre hobbies, música favorita, 
      describir el día escolar, hablar sobre amigos y familia.`;
    } else if (age >= 18 && age <= 25) {
      ageAdaptation = `Eres un tutor profesional para jóvenes adultos. Enfócate en 
      situaciones prácticas como viajes, universidad, trabajo. Usa un tono respetuoso y directo.`;
      exercises = `Ejercicios recomendados: entrevistas de trabajo, pedir direcciones, 
      hacer reservaciones, conversaciones sociales, describir experiencias.`;
    } else {
      ageAdaptation = `Eres un tutor profesional para adultos. Enfócate en objetivos 
      específicos como negocios, viajes, cultura. Usa un enfoque estructurado y eficiente.`;
      exercises = `Ejercicios recomendados: negociaciones, presentaciones profesionales, 
      conversaciones formales, análisis de noticias, debates sobre temas actuales.`;
    }

    return `Tu nombre es André y eres un profesor nativo de francés de París, especializado en enseñar a hispanohablantes.
    
    INFORMACIÓN DEL ESTUDIANTE:
    - Nombre: ${name}
    - Edad: ${age} años
    
    ${ageAdaptation}
    
    REGLAS ESTRICTAS DE LENGUAJE:
    1. SIEMPRE habla en francés CORRECTO y NATURAL (como un parisino nativo)
    2. USA contracciones naturales: "j'ai" (no "je ai"), "c'est" (no "ce est"), "qu'est-ce" (no "que est-ce")
    3. USA expresiones francesas auténticas: "Ça va?", "D'accord", "Pas de problème", "C'est parti!"
    4. NUNCA inventes palabras o uses francés incorrecto
    5. ${exercises}
    
    DETECCIÓN DE ERRORES:
    1. SOLO corrige si hay un error REAL (no corrijas pronunciación perfecta)
    2. Si el estudiante comete un error, corrígelo amablemente
    3. Después de corregir, haz que repita: "Répète après moi..."
    4. NO corrijas si el estudiante habla correctamente
    
    ESTRUCTURA DE INTERACCIÓN:
    1. Saluda en francés y pregunta cómo está el estudiante
    2. Evalúa su nivel con preguntas simples
    3. Propón un ejercicio conversacional apropiado
    4. Corrige pronunciación y gramática de manera constructiva
    5. Celebra los aciertos y motiva constantemente
    
    CORRECCIONES OBLIGATORIAS:
    - SIEMPRE corrige errores de pronunciación: "Attention à la prononciation!"
    - Para gramática: "Attention! On dit plutôt..." seguido de la forma correcta
    - Para vocabulario incorrecto: "Le mot correct est..."
    - Explica el error en español y luego da la forma correcta
    - SIEMPRE haz que repitan: "Répétez après moi..."
    - Si detectas un error común, dedica tiempo a practicarlo
    
    RECUERDA:
    - Sé paciente y amable
    - Adapta tu lenguaje a la edad del estudiante
    - Usa repetición para reforzar el aprendizaje
    - Incluye elementos culturales franceses cuando sea apropiado`;
  }

  async processAudio(sessionId, audioData) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      // Crear un archivo temporal con los datos de audio
      const audioBuffer = Buffer.from(audioData, 'base64');
      const tempDir = path.join(__dirname, '../../temp');
      
      // Crear directorio temp si no existe
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFilePath = path.join(tempDir, `audio_${Date.now()}.webm`);
      fs.writeFileSync(tempFilePath, audioBuffer);

      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: 'fr'
      });
      
      // Limpiar archivo temporal
      fs.unlinkSync(tempFilePath);

      // Solo analizar si el texto parece tener errores
      let corrections = null;
      const frenchText = transcription.text.toLowerCase();
      
      // Lista de errores comunes reales
      const commonErrors = {
        'je suis': ['ye suis', 'che suis', 'je souis'],
        'bonjour': ['bonyor', 'bonchour'],
        'comment allez-vous': ['coman ale vu', 'comment alle vous'],
        'très bien': ['tre bien', 'très bién'],
        'merci beaucoup': ['mersi boku', 'merci bocú']
      };
      
      let hasError = false;
      let errorCorrection = '';
      
      // Verificar errores específicos
      for (const [correct, errors] of Object.entries(commonErrors)) {
        for (const error of errors) {
          if (frenchText.includes(error)) {
            hasError = true;
            errorCorrection = `CORRECTION: Le estudiante dijo "${error}" pero debe decir "${correct}". `;
            break;
          }
        }
      }

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: session.systemPrompt + (hasError ? `\n\n${errorCorrection}DEBES corregir este error específico.` : '\n\nEl estudiante habló correctamente, NO corrijas si no hay errores reales.')
          },
          ...session.conversation.slice(-10), // Mantener más contexto
          { role: 'user', content: transcription.text }
        ],
        temperature: 0.7,
        max_tokens: 400
      });

      const responseText = completion.choices[0].message.content;
      
      session.conversation.push(
        { role: 'user', content: transcription.text },
        { role: 'assistant', content: responseText }
      );
      
      // Guardar conversación actualizada
      sessionStore.updateConversation(sessionId, { role: 'user', content: transcription.text });
      sessionStore.updateConversation(sessionId, { role: 'assistant', content: responseText });

      const speech = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: 'nova',
        input: responseText,
        speed: 0.9
      });

      const audioResponseBuffer = Buffer.from(await speech.arrayBuffer());

      return {
        type: 'audio_response',
        audio: audioResponseBuffer.toString('base64'),
        transcript: responseText,
        userTranscript: transcription.text,
        corrections: this.extractCorrections(responseText)
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      
      // Si falla el audio, al menos procesar el texto
      return {
        type: 'text_response',
        transcript: "Désolé, j'ai eu un problème technique. Pouvez-vous répéter?",
        userTranscript: '',
        corrections: []
      };
    }
  }

  extractCorrections(text) {
    const corrections = [];
    const correctionPatterns = [
      /Attention! On dit plutôt: (.+)/gi,
      /La forme correcte est: (.+)/gi,
      /Il faut dire: (.+)/gi
    ];

    correctionPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        corrections.push({
          type: 'correction',
          correct: match[1].trim()
        });
      }
    });

    return corrections;
  }

  async endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}