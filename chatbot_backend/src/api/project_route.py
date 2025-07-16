import os
import shutil
import json
import uuid
from typing import List
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends, Query, Path
from src.database import get_db
from src.api.auth_route import get_current_user
from src.services.session_manager import SessionManager
from src.initialize import vector_store

# Define models
class ProjectCreate(BaseModel):
    project_name: str = Field(..., description="Name of the project")
    file_ids: List[int] = Field(..., description="List of file IDs to include in the project")

class ProjectResponse(BaseModel):
    project_id: int
    session_id: str
    message: str

# Router setup
project_router = APIRouter(prefix="/projects", tags=["PROJECTS"])

# Temp directory for project files
TEMP_PROJECT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "temp_projects")
os.makedirs(TEMP_PROJECT_DIR, exist_ok=True)

# Session manager instance
session_manager = SessionManager()

@project_router.post("/create", status_code=201, response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create a new project with session and vector initialization"""
    cursor = db.cursor()
    
    try:
        # Verify that all file IDs belong to the user
        placeholders = ','.join('?' * len(project.file_ids))
        cursor.execute(f"""
            SELECT COUNT(*) as count
            FROM file_details 
            WHERE file_id IN ({placeholders}) AND user_id = ?
        """, (*project.file_ids, current_user['id']))
        
        result = cursor.fetchone()
        if result['count'] != len(project.file_ids):
            raise HTTPException(status_code=400, detail="One or more files do not exist or you don't have permission to access them")
        
        # Create a new session ID
        session_id = f"session_{uuid.uuid4().hex[:10]}"
        session_manager.get_or_create_session(session_id)
        
        # Store file IDs as JSON
        file_ids_json = json.dumps(project.file_ids)
        
        # Insert project
        cursor.execute("""
            INSERT INTO project_details (
                user_id, project_name, file_ids, session_id, is_active, initialization_status
            ) VALUES (?, ?, ?, ?, 1, 'pending')
        """, (current_user['id'], project.project_name, file_ids_json, session_id))
        
        project_id = cursor.lastrowid
        db.commit()
        
        # Initialize vector store (synchronously)
        # Create project temp directory
        project_temp_dir = os.path.join(TEMP_PROJECT_DIR, f"project_{project_id}")
        os.makedirs(project_temp_dir, exist_ok=True)
        
        # Get file paths for selected files
        placeholders = ','.join('?' * len(project.file_ids))
        cursor.execute(f"""
            SELECT file_id, file_name, file_path 
            FROM file_details 
            WHERE file_id IN ({placeholders}) AND user_id = ?
        """, (*project.file_ids, current_user['id']))
        
        files = cursor.fetchall()
        
        # Copy files to project directory
        for file in files:
            dest_path = os.path.join(project_temp_dir, file['file_name'])
            shutil.copy2(file['file_path'], dest_path)
        
        # Initialize vector store
        vector_store.load_embeddings(project_temp_dir)
        
        # Update project status
        cursor.execute("""
            UPDATE project_details 
            SET initialization_status = 'completed'
            WHERE project_id = ?
        """, (project_id,))
        db.commit()
        
        return {
            "project_id": project_id,
            "session_id": session_id,
            "message": "Project created successfully with initialized embeddings."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")
    finally:
        db.close()

@project_router.post("/start/{project_id}")
def start_project(
    project_id: int = Path(..., description="ID of the project to start"),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Start an existing project and initialize vectorstore"""
    cursor = db.cursor()
    
    # Get project details
    cursor.execute("""
        SELECT project_id, project_name, session_id, file_ids, initialization_status
        FROM project_details 
        WHERE project_id = ? AND user_id = ? AND is_active = 1
    """, (project_id, current_user['id']))
    
    project = cursor.fetchone()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found, inactive, or unauthorized")
    
    # Check if the session still exists
    if not session_manager.session_exists(project['session_id']):
        # If session doesn't exist, mark project as inactive
        cursor.execute("""
            UPDATE project_details 
            SET is_active = 0
            WHERE project_id = ?
        """, (project_id,))
        db.commit()
        raise HTTPException(status_code=400, detail="Project session has expired. Please create a new project.")
    
    try:
        # Parse file IDs
        file_ids = json.loads(project['file_ids'])
        
        # Initialize vector store
        project_temp_dir = os.path.join(TEMP_PROJECT_DIR, f"project_{project_id}")
        
        # Create directory if it doesn't exist
        if not os.path.exists(project_temp_dir):
            os.makedirs(project_temp_dir, exist_ok=True)
            
            # Copy files to project directory
            placeholders = ','.join('?' * len(file_ids))
            cursor.execute(f"""
                SELECT file_id, file_name, file_path 
                FROM file_details 
                WHERE file_id IN ({placeholders}) AND user_id = ?
            """, (*file_ids, current_user['id']))
            
            files = cursor.fetchall()
            
            # Copy files to project directory
            for file in files:
                dest_path = os.path.join(project_temp_dir, file['file_name'])
                shutil.copy2(file['file_path'], dest_path)
        
        # Load the vector store
        vector_store.load_embeddings(project_temp_dir)
        
        # Update project status if needed
        if project['initialization_status'] != 'completed':
            cursor.execute("""
                UPDATE project_details 
                SET initialization_status = 'completed'
                WHERE project_id = ?
            """, (project_id,))
            db.commit()
        
        return {
            "project_id": project_id,
            "session_id": project['session_id'],
            "message": "Project started successfully. Ready for chat."
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting project: {str(e)}")
    finally:
        db.close()

@project_router.get("/list")
def list_projects(
    current_user: dict = Depends(get_current_user),
    active_only: bool = Query(False, description="Only show active projects"),
    db = Depends(get_db)
):
    """List all projects for the current user, returning file names instead of file IDs"""
    cursor = db.cursor()
    try:
        query = """
            SELECT project_id, project_name, session_id, file_ids, 
                   is_active, initialization_status, created_at
            FROM project_details 
            WHERE user_id = ?
        """
        if active_only:
            query += " AND is_active = 1"
        cursor.execute(query, (current_user['id'],))
        projects = []
        for row in cursor.fetchall():
            # Parse the file_ids from JSON
            try:
                file_ids = json.loads(row['file_ids'])
            except:
                file_ids = []
            # Fetch file names for these file_ids
            file_names = []
            if file_ids:
                placeholders = ','.join('?' * len(file_ids))
                cursor.execute(
                    f"SELECT file_name FROM file_details WHERE file_id IN ({placeholders}) AND user_id = ?",
                    (*file_ids, current_user['id'])
                )
                file_names = [f['file_name'] for f in cursor.fetchall()]
            projects.append({
                "project_id": row['project_id'],
                "project_name": row['project_name'],
                "session_id": row['session_id'],
                "file_names": file_names,
                "is_active": bool(row['is_active']),
                "initialization_status": row['initialization_status'],
                "created_at": row['created_at']
            })
        return {"projects": projects, "count": len(projects)}
    finally:
        db.close()

@project_router.get("/specific/{project_id}")
def get_project_details(
    project_id: int = Path(..., description="ID of the project to fetch"),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Fetch details of a specific project by project_id, returning file names instead of file IDs"""
    cursor = db.cursor()
    try:
        cursor.execute("""
            SELECT project_id, project_name, session_id, file_ids, 
                   is_active, initialization_status, created_at
            FROM project_details
            WHERE project_id = ? AND user_id = ?
        """, (project_id, current_user['id']))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Project not found or unauthorized")
        try:
            file_ids = json.loads(row['file_ids'])
        except Exception:
            file_ids = []

        # Fetch file names for these file_ids
        file_names = []
        if file_ids:
            placeholders = ','.join('?' * len(file_ids))
            cursor.execute(
                f"SELECT file_name FROM file_details WHERE file_id IN ({placeholders}) AND user_id = ?",
                (*file_ids, current_user['id'])
            )
            file_names = [f['file_name'] for f in cursor.fetchall()]

        return {
            "project_id": row['project_id'],
            "project_name": row['project_name'],
            "session_id": row['session_id'],
            "file_names": file_names,
            "is_active": bool(row['is_active']),
            "initialization_status": row['initialization_status'],
            "created_at": row['created_at']
        }
    finally:
        db.close()

@project_router.delete("/{project_id}")
def delete_project(
    project_id: int = Path(..., description="ID of the project to delete"),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Delete a project and its associated session"""
    cursor = db.cursor()
    
    # Check if project exists and belongs to user
    cursor.execute("""
        SELECT session_id 
        FROM project_details 
        WHERE project_id = ? AND user_id = ?
    """, (project_id, current_user['id']))
    
    project = cursor.fetchone()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized")
    
    try:
        # Delete project from database
        cursor.execute("""
            DELETE FROM project_details 
            WHERE project_id = ? AND user_id = ?
        """, (project_id, current_user['id']))
        
        db.commit()
        
        # Clear the session
        if session_manager.session_exists(project['session_id']):
            session_manager.clear_session(project['session_id'])
        
        # Clean up temporary files
        project_temp_dir = os.path.join(TEMP_PROJECT_DIR, f"project_{project_id}")
        if os.path.exists(project_temp_dir):
            shutil.rmtree(project_temp_dir, ignore_errors=True)
        
        return {"message": "Project and associated session deleted successfully"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting project: {str(e)}")
    finally:
        db.close()