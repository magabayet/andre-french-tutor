class SessionStore {
  constructor() {
    this.sessions = new Map();
  }

  saveSession(sessionId, session) {
    this.sessions.set(sessionId, {
      ...session,
      lastUpdated: new Date()
    });
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Verificar si la sesión no es muy antigua (máximo 2 horas)
      const hoursSinceUpdate = (new Date() - session.lastUpdated) / (1000 * 60 * 60);
      if (hoursSinceUpdate > 2) {
        this.sessions.delete(sessionId);
        return null;
      }
      return session;
    }
    return null;
  }

  updateConversation(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.conversation.push(message);
      session.lastUpdated = new Date();
      
      // Limitar el tamaño de la conversación a 50 mensajes
      if (session.conversation.length > 50) {
        // Mantener el mensaje de bienvenida y los últimos 49
        const welcome = session.conversation[0];
        session.conversation = [welcome, ...session.conversation.slice(-49)];
      }
      
      this.sessions.set(sessionId, session);
    }
  }

  deleteSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  cleanOldSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      const hoursSinceUpdate = (now - session.lastUpdated) / (1000 * 60 * 60);
      if (hoursSinceUpdate > 2) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

export const sessionStore = new SessionStore();

// Limpiar sesiones viejas cada hora
setInterval(() => {
  sessionStore.cleanOldSessions();
}, 60 * 60 * 1000);