from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.chain_route import rag_router
from src.api.auth_route import auth_router
from src.api.file_route import file_router
from src.api.project_route import project_router
from src.database import init_db

app = FastAPI(title="RAG ChatBot API")

# Initialize the database
init_db()

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to RAG API"}

app.include_router(auth_router)
app.include_router(file_router)
app.include_router(rag_router)
app.include_router(project_router)

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)