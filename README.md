# André 1.0 - Tutor de Francés con IA

André 1.0 es una aplicación de tutoría de francés impulsada por IA que se adapta a la edad del estudiante (5-40 años) para proporcionar una experiencia de aprendizaje personalizada.

## 🌟 Características

- **Conversación en Tiempo Real**: Utiliza la API Realtime de OpenAI para conversaciones de voz naturales
- **Adaptación por Edad**: Contenido y metodología personalizada según la edad del estudiante
- **Correcciones Inteligentes**: Retroalimentación instantánea sobre pronunciación y gramática
- **Ejercicios Dinámicos**: Actividades adaptadas al nivel y edad del estudiante
- **Interfaz Intuitiva**: Diseño moderno y fácil de usar con React y Tailwind CSS

## 🚀 Instalación Rápida

### Requisitos Previos

- Node.js 20+
- NPM o Yarn
- Clave API de OpenAI

### Configuración Local

1. **Clonar el repositorio**
```bash
cd /Users/miguelgabayetbodington/LOC_PROGRAM/ANDRE_1.0
```

2. **Configurar variables de entorno**
```bash
cp backend/.env.example backend/.env
# Editar backend/.env y agregar tu OPENAI_API_KEY
```

3. **Instalar dependencias**
```bash
npm run install:all
```

4. **Iniciar la aplicación**
```bash
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:5000
- Backend: http://localhost:5001

## 🐳 Despliegue con Docker

### Construcción y ejecución

```bash
# Construir y ejecutar con Docker Compose
docker-compose up --build

# O ejecutar en segundo plano
docker-compose up -d
```

La aplicación estará disponible en http://localhost:8080

### Detener la aplicación

```bash
docker-compose down
```

## 📁 Estructura del Proyecto

```
ANDRE_1.0/
├── backend/                 # Servidor Express.js
│   ├── routes/              # Rutas API
│   ├── services/            # Lógica de negocio
│   └── server.js            # Punto de entrada del servidor
├── frontend/                # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas de la aplicación
│   │   └── App.jsx          # Componente principal
│   └── package.json
├── docker-compose.yml       # Configuración Docker
└── README.md
```

## 🎯 Uso de la Aplicación

1. **Crear Perfil**: Ingresa tu nombre y edad (5-40 años)
2. **Iniciar Sesión**: Comienza una sesión de tutoría con André
3. **Conversar**: Habla en francés y recibe correcciones en tiempo real
4. **Ejercicios**: Accede a ejercicios adaptados a tu edad y nivel
5. **Practicar**: Mejora tu pronunciación y gramática con feedback instantáneo

## 🔧 Configuración Avanzada

### Variables de Entorno

- `OPENAI_API_KEY`: Tu clave API de OpenAI (requerida)
- `PORT`: Puerto del servidor backend (default: 5001)
- `NODE_ENV`: Entorno de ejecución (development/production)

### Personalización

Puedes personalizar los ejercicios y prompts en:
- `backend/routes/exercises.js`: Ejercicios por grupo de edad
- `backend/services/realtimeService.js`: Prompts del sistema y personalidad de André

## 📝 Notas Importantes

- **API de OpenAI**: Requiere acceso a la API Realtime de OpenAI (gpt-4o-realtime-preview)
- **Micrófono**: La aplicación requiere acceso al micrófono para la funcionalidad de voz
- **Navegador**: Funciona mejor en Chrome, Firefox o Edge modernos
- **Conexión**: Requiere conexión a internet estable para las conversaciones en tiempo real

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🆘 Soporte

Si encuentras algún problema o tienes preguntas, por favor abre un issue en el repositorio.

---

Desarrollado con ❤️ para ayudar a hispanohablantes a aprender francés de manera efectiva y divertida.