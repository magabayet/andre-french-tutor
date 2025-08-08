# André 1.0 - Tutor de Francés con IA

André 1.0 es una aplicación de tutoría de francés impulsada por inteligencia artificial, diseñada específicamente para hispanohablantes que desean aprender francés de manera interactiva y personalizada.

## 🎯 Características

- **Reconocimiento de voz** con tecnología Whisper de OpenAI
- **Conversación en tiempo real** mediante WebSockets
- **Corrección de pronunciación** específica para hispanohablantes
- **Adaptación por edad** (5-40 años) con contenido apropiado
- **Síntesis de voz natural** para respuestas en francés
- **Interfaz intuitiva y atractiva** con React y Tailwind CSS

## 🚀 Instalación

### Prerrequisitos

- Node.js (v16 o superior)
- NPM o Yarn
- Clave API de OpenAI

### Configuración

1. Clona el repositorio:
\`\`\`bash
git clone https://github.com/tu-usuario/andre-french-tutor.git
cd andre-french-tutor
\`\`\`

2. Instala las dependencias del backend:
\`\`\`bash
cd backend
npm install
\`\`\`

3. Configura las variables de entorno:
\`\`\`bash
cp .env.example .env
# Edita .env y agrega tu clave API de OpenAI
\`\`\`

4. Instala las dependencias del frontend:
\`\`\`bash
cd ../frontend
npm install
\`\`\`

## 🎮 Uso

1. Inicia el servidor backend:
\`\`\`bash
cd backend
npm start
\`\`\`

2. En otra terminal, inicia el frontend:
\`\`\`bash
cd frontend
npm run dev
\`\`\`

3. Abre tu navegador en http://localhost:5000

## 🏗️ Arquitectura

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + WebSockets
- **IA**: OpenAI GPT-3.5-turbo + Whisper + TTS
- **Persistencia**: Sesiones en memoria con limpieza automática

## 📱 Funcionalidades

### Para Niños (5-10 años)
- Vocabulario básico con animales y colores
- Juegos y canciones interactivas
- Retroalimentación positiva constante

### Para Adolescentes (11-17 años)
- Conversaciones sobre hobbies y vida escolar
- Referencias a cultura popular
- Ejercicios dinámicos

### Para Jóvenes Adultos (18-25 años)
- Situaciones prácticas (viajes, universidad)
- Preparación para entrevistas
- Conversaciones sociales

### Para Adultos (26-40 años)
- Francés de negocios
- Debates sobre temas actuales
- Presentaciones profesionales

## 🐳 Docker

También puedes ejecutar la aplicación con Docker:

\`\`\`bash
docker-compose up
\`\`\`

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit tus cambios (\`git commit -m 'Add some AmazingFeature'\`)
4. Push a la branch (\`git push origin feature/AmazingFeature\`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## 🙏 Agradecimientos

- OpenAI por su increíble API
- La comunidad de React y Node.js
- Todos los colaboradores del proyecto

---

🤖 Generado con [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF < /dev/null