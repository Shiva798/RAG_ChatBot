# RAG ChatBot - Complete Setup Guide

A comprehensive full-stack AI-powered document question-answering system combining a FastAPI backend with an Angular frontend using Retrieval-Augmented Generation (RAG) technology.

## 🏗️ Project Overview

This project consists of two main components:
- **Backend**: FastAPI-based REST API with RAG capabilities using Groq LLM
- **Frontend**: Angular 19 application with SSR and modern UI components

## 🚀 Features

### 🔧 Backend Features
- **RAG (Retrieval-Augmented Generation)** using LangChain and Groq LLM
- **Document Processing** with PDF support
- **Vector Store** using FAISS and ChromaDB
- **User Authentication** with JWT tokens
- **File Upload & Management**
- **Session Management** for conversation context
- **Wikipedia Integration**

### 🎨 Frontend Features
- **Angular 19** with Server-Side Rendering
- **Real-time Chat Interface**
- **File Upload Interface**
- **User Authentication**
- **PDF Export** functionality
- **Responsive Design**
- **Notification System**

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **Git** - [Download Git](https://git-scm.com/)
- **Groq API Key** - [Get API Key](https://console.groq.com/)

### Verify Installation
```bash
# Check Python version
python --version

# Check Node.js version
node --version

# Check npm version
npm --version

# Check Git version
git --version
```

## 🛠️ Complete Setup Guide

### 1. Clone the Repository

```bash
git clone <repository-url>
cd RAG_ChatBot
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd chatbot_backend

# Create and activate virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirement.txt

# Create environment file
echo. > .env

# Add your Groq API key to .env file
echo GROQ_API_TOKEN=your_groq_api_key_here >> .env
```

**Important**: Replace `your_groq_api_key_here` with your actual Groq API key.

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd chatbot_frontend

# Install Angular CLI globally
npm install -g @angular/cli

# Install project dependencies
npm install
```

### 4. Start the Application

You need to run both backend and frontend simultaneously.

**Terminal 1 - Backend**:
```bash
cd chatbot_backend

# Activate virtual environment if not already active
venv\Scripts\activate

# Start FastAPI server
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend**:
```bash
cd chatbot_frontend

# Start Angular development server
npm start
```

### 5. Access the Application

- **Frontend**: http://localhost:4200
- **Backend API Docs**: http://localhost:8000/docs
- **Backend Health Check**: http://localhost:8000

## 📁 Project Structure

```
RAG_ChatBot/
├── README.md                    # Original project documentation
├── PROJECT_SETUP_README.md      # This comprehensive setup guide
├── .gitignore                   # Git ignore rules (to be created)
│
├── chatbot_backend/             # FastAPI Backend
│   ├── SETUP_README.md              # Backend-specific setup guide
│   ├── app.py                       # Main FastAPI application
│   ├── requirement.txt              # Python dependencies
│   ├── .env                         # Environment variables (create this)
│   ├── chat_rag.db                  # SQLite database (auto-created)
│   ├── Input/                       # Sample documents
│   ├── temp_projects/               # User project files
│   └── src/                         # Source code
│       ├── database.py                  # Database configuration
│       ├── api/                         # API endpoints
│       └── services/                    # Business logic
│
└── chatbot_frontend/            # Angular Frontend
    ├── SETUP_README.md              # Frontend-specific setup guide
    ├── package.json                 # Node.js dependencies
    ├── angular.json                 # Angular configuration
    └── src/                         # Source code
        └── app/                         # Angular application
            ├── components/                  # UI components
            └── services/                    # Angular services
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `chatbot_backend` directory:
```env
# Required: Groq API Configuration
GROQ_API_TOKEN=your_groq_api_key_here

# Optional: Database Configuration
DATABASE_URL=./chat_rag.db
```

### Backend-Frontend Communication

The frontend is configured to connect to the backend at `http://127.0.0.1:8000`. If you need to change this:

1. Update `chatbot_frontend/src/app/services/ragchatbot.endpoints.config.ts`
2. Change the `configbaseUrl` property to your backend URL

## 🔍 Troubleshooting

### Common Issues

1. **Python Virtual Environment Issues**
   ```bash
   # Delete and recreate virtual environment
   rmdir /s venv
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirement.txt
   ```

2. **Node.js Dependencies Issues**
   ```bash
   # Clear npm cache and reinstall
   cd chatbot_frontend
   rmdir /s node_modules
   del package-lock.json
   npm cache clean --force
   npm install
   ```

3. **Port Conflicts**
   ```bash
   # Backend on different port
   uvicorn app:app --reload --port 8001
   
   # Frontend on different port
   ng serve --port 4201
   ```

4. **API Connection Issues**
   - Ensure backend is running before starting frontend
   - Check CORS configuration in backend
   - Verify API endpoints in frontend configuration

5. **Groq API Issues**
   - Verify your API key is correct
   - Check API quota and usage limits
   - Ensure stable internet connection

### Getting Help

1. **Backend Issues**: Check `chatbot_backend/SETUP_README.md`
2. **Frontend Issues**: Check `chatbot_frontend/SETUP_README.md`
3. **API Documentation**: Visit `http://localhost:8000/docs`

## 🚀 Quick Start Commands

Once everything is set up, use these commands to start development:

```bash
# Start backend (Terminal 1)
cd chatbot_backend && venv\Scripts\activate && uvicorn app:app --reload

# Start frontend (Terminal 2)
cd chatbot_frontend && npm start
```

## 📝 Usage Guide

1. **Register/Login**: Create an account or log in
2. **Upload Documents**: Upload PDF files for analysis
3. **Create Projects**: Organize your documents into projects
4. **Ask Questions**: Chat with your documents using natural language
5. **Export Conversations**: Download chat history as PDF

## 🔒 Security Notes

- Keep your Groq API key secure and never commit it to version control
- Use environment variables for sensitive configuration
- Consider implementing rate limiting for production use
- Update CORS settings for production deployment

## 🚀 Production Deployment

### Backend Deployment
- Use a production WSGI server like Gunicorn
- Configure environment variables securely
- Use PostgreSQL or another production database
- Implement proper logging and monitoring

### Frontend Deployment
- Build for production: `npm run build`
- Serve static files from a CDN
- Configure proper CSP headers
- Enable HTTPS

## 📞 Support

For detailed setup instructions:
- **Backend Setup**: See `chatbot_backend/SETUP_README.md`
- **Frontend Setup**: See `chatbot_frontend/SETUP_README.md`
- **API Documentation**: Available at `/docs` endpoint when backend is running

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
