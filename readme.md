# AI Study Buddy 📚🤖

**Built an AI-powered study assistant using React, Node.js, and Gemini API to enable natural language note querying, document processing, and intelligent session management.**

## 🔗 Live Links
- **Frontend:** [https://aistudybuddy.netlify.app](https://aistudybuddy.netlify.app)
- **Backend:** [https://aistudybuddy.onrender.com](https://aistudybuddy.onrender.com)

## 🔍 Overview
Developed a full-stack study assistant that processes PDFs and text notes using OCR, implements RAG-based semantic search with vector embeddings, and provides AI-powered Q&A capabilities. Features include secure authentication, session tracking, intelligent caching, and API rate limit management.

## ⚙️ Tech Stack
- **Frontend:** React, Vite, TailwindCSS, Framer Motion
- **Backend:** Node.js, Express.js, MongoDB
- **AI/ML:** Gemini API (with key rotation), Groq (Llama models), Jina AI (Embeddings), Vector Search
- **Storage & External APIs:** Cloudinary, Google Drive API
- **Features:** JWT Authentication, OCR Processing, RAG Implementation, Intelligent Caching (Redis)
- **Deployment:** Netlify (Frontend), Render (Backend)  

---

## 🎯 Key Features
- **Document Processing:** OCR-powered PDF and text extraction with intelligent chunking
- **Semantic Search:** Vector embeddings and similarity matching for relevant context retrieval
- **AI Chat:** Natural language Q&A with RAG-enhanced responses using Gemini API
- **Session Management:** Persistent chat history and note organization
- **Smart Caching:** Redis-based caching for embeddings and API responses
- **Rate Limiting:** Intelligent API key rotation to handle usage limits
- **Authentication:** Secure JWT-based user authentication

---

## 🗓️ Development Timeline


| Day | Task |
|-----|------|
| 1 | Submit project idea + daily plan |
| 2 | Create low-fidelity wireframes in Figma |
| 3 | Create high-fidelity designs |
| 4 | Set up GitHub project & milestones |
| 5 | Manage daily tasks in GitHub Projects |
| 6 | Initialize frontend with React & Tailwind |
| 7 | Build UI components (chat, upload, sidebar) |
| 8 | Match frontend to design |
| 9 | Deploy frontend to Vercel |
|10 | Set up Express backend |
|11 | Implement GET API |
|12 | Implement POST API |
|13 | Implement PUT API |
|14 | Deploy backend to Render |
|15 | Design MongoDB schemas |
|16 | DB Read/Write operations |
|17 | Implement entity relationships |
|18 | Add file upload functionality |
|19 | Add username/password authentication |
|20 | Add Google OAuth |
|21 | Implement Update/Delete |
|22 | Protect routes using JWT |
|23 | Update Bruno API collection |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB
- API Keys: Gemini API, Jina AI, Groq API, Google Drive API
- Cloud Services: Cloudinary, Redis (Upstash)

### Installation

```bash
# Clone repository
git clone <repository-url>

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../client
npm install

# Configure environment variables
# Create .env in backend/ with:
# - MONGODB_URI, JWT_SECRET, PORT, VITE_API_URL
# - GEMINI_API_KEY (supports multiple keys like GEMINI_API_KEY_2 for rotation)
# - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
# - JINA_API_KEY (for embeddings)
# - GROQ_API_KEY (for Llama models)
# - REDIS_URL (for caching)
# - GOOGLE_DRIVE_API_KEY (for Drive access)

# Run backend
cd backend
npm start

# Run frontend
cd client
npm run dev
```

---

## 📝 Contributing
Contributions, feedback, and reviews are welcome via pull requests!
