export class TextService {
  constructor(openai) {
    this.openai = openai;
  }

  async processText(session, text) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: session.systemPrompt },
          ...session.conversation.slice(-10), // Mantener más contexto
          { role: 'user', content: text }
        ],
        temperature: 0.7,
        max_tokens: 400
      });

      const responseText = completion.choices[0].message.content;
      
      session.conversation.push(
        { role: 'user', content: text },
        { role: 'assistant', content: responseText }
      );

      // Generar audio de la respuesta
      const speech = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: 'ash',
        input: responseText,
        speed: 0.9
      });

      const audioBuffer = Buffer.from(await speech.arrayBuffer());

      return {
        type: 'text_response',
        audio: audioBuffer.toString('base64'),
        transcript: responseText,
        corrections: this.extractCorrections(responseText)
      };
    } catch (error) {
      console.error('Error processing text:', error);
      throw error;
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
}