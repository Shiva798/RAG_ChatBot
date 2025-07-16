# RAG ChatBot Backend - Setup Guide

A FastAPI-based backend service that provides intelligent document-based question answering using Retrieval-Augmented Generation (RAG) technology with Groq LLM and LangChain.

## 🚀 Features

- **FastAPI REST API** with comprehensive endpoints
- **RAG (Retrieval-Augmented Generation)** using LangChain and Groq LLM
- **Document Processing** with PDF support via PyPDF
- **Vector Store** using FAISS and ChromaDB for efficient document retrieval
- **Session Management** for maintaining conversation context
- **User Authentication** with JWT tokens and OAuth2
- **File Upload & Management** with project organization
- **Wikipedia Integration** for enhanced knowledge base
- **Smart Conversation Routing** with greeting/farewell detection

## 📋 Prerequisites

- **Python 3.8 or higher**
- **pip** (Python package installer)
- **Groq API Key** (Sign up at [Groq Console](https://console.groq.com/))

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd RAG_ChatBot/chatbot_backend
```

### 2. Create Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirement.txt
```

### 4. Environment Configuration

Create a `.env` file in the `chatbot_backend` directory:
```bash
# Create .env file
echo. > .env
```

Add the following environment variables to your `.env` file:
```env
# Groq API Configuration
GROQ_API_TOKEN=your_groq_api_key_here

# Optional: Database Configuration (SQLite is used by default)
DATABASE_URL=./chat_rag.db
```

**Important:** Replace `your_groq_api_key_here` with your actual Groq API key from [Groq Console](https://console.groq.com/).

### 5. Initialize Database
The database will be automatically initialized when you first run the application. It creates:
- `users` table for user authentication
- `file_details` table for file management
- `projects` table for project organization

## 🚀 Running the Application

### Development Mode
```bash
# Make sure virtual environment is activated
# If not activated:
venv\Scripts\activate

# Run the FastAPI server
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
# Install uvicorn with production dependencies
pip install uvicorn[standard]

# Run the server
uvicorn app:app --host 0.0.0.0 --port 8000
```

### Verify Installation
Open your browser and navigate to:
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/

## 📁 Project Structure

```
chatbot_backend/
├── app.py                 # Main FastAPI application
├── requirement.txt        # Python dependencies
├── chat_rag.db           # SQLite database (auto-created)
├── .env                  # Environment variables (create this)
├── Input/                # Sample input documents
├── temp_projects/        # Temporary project files
└── src/
    ├── database.py       # Database configuration
    ├── initialize.py     # Initialization utilities
    ├── prompt_template.py # LLM prompt templates
    ├── rag_schemas.py    # Pydantic models
    ├── api/              # API route handlers
    │   ├── auth_route.py     # Authentication endpoints
    │   ├── chain_route.py    # RAG chain endpoints
    │   ├── file_route.py     # File management endpoints
    │   └── project_route.py  # Project management endpoints
    └── services/         # Business logic services
        ├── conversation_manager.py # Chat conversation handling
        ├── llm_service.py         # LLM integration
        ├── session_manager.py     # Session management
        └── vector_store.py        # Vector database operations
```

## 🔧 Configuration Options

### Environment Variables
- `GROQ_API_TOKEN`: Your Groq API key (required)
- `DATABASE_URL`: Database connection string (optional, defaults to SQLite)

### LLM Models Used
- **Main Chat**: `llama-3.3-70b-versatile`
- **Conversation Classification**: `llama3-8b-8192`

## 📚 API Endpoints

### Authentication
- `POST /auth/create_user` - User registration
- `POST /auth/login_user` - User login
- `POST /auth/oauth_token` - OAuth token generation
- `PUT /auth/password_modification` - Password change
- `DELETE /auth/delete_user` - User deletion

### File Management
- `POST /files/upload` - Upload documents
- `GET /files/get_files` - List user files
- `DELETE /files/delete_file` - Delete files

### RAG Chain
- `POST /rag/ask_question` - Ask questions about documents
- `GET /rag/get_conversation_history` - Get chat history

### Projects
- `POST /projects/create_project` - Create new project
- `GET /projects/get_projects` - List user projects
- `DELETE /projects/delete_project` - Delete projects

## 🔍 Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   # Ensure virtual environment is activated
   venv\Scripts\activate
   # Reinstall dependencies
   pip install -r requirement.txt
   ```

2. **Groq API Errors**
   - Verify your API key in the `.env` file
   - Check your Groq API quota and usage limits
   - Ensure the API key has proper permissions

3. **Database Issues**
   - Delete `chat_rag.db` and restart the application to recreate
   - Check file permissions in the project directory

4. **Port Already in Use**
   ```bash
   # Use a different port
   uvicorn app:app --reload --port 8001
   ```

### Dependency Issues
If you encounter dependency conflicts:
```bash
# Create a fresh virtual environment
deactivate
rmdir /s venv
python -m venv venv
venv\Scripts\activate
pip install -r requirement.txt
```

## 📝 Development Notes

- The application uses SQLite by default for simplicity
- Vector stores are created dynamically for each project
- File uploads are stored in `temp_projects/` directory
- Session management maintains conversation context
- CORS is enabled for all origins (configure for production)
