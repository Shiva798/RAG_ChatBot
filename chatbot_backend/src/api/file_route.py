import os
import shutil
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from src.database import get_db
from src.api.auth_route import get_current_user

file_router = APIRouter(prefix="/files", tags=["FILES"])

# Configure the input directory path (relative to project root)
INPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "Input")


# Create the directories if they don't exist
os.makedirs(INPUT_DIR, exist_ok=True)

@file_router.post("/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload files and store details in database
    """
    uploaded_files = []
    db = get_db()
    cursor = db.cursor()
    
    try:
        for file in files:
            file_path = os.path.join(INPUT_DIR, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Store file details in database
            cursor.execute("""
                INSERT INTO file_details (user_id, file_name, file_path)
                VALUES (?, ?, ?)
            """, (current_user['id'], file.filename, file_path))
            
            uploaded_files.append({
                "file_id": cursor.lastrowid,
                "file_name": file.filename,
                "file_path": file_path
            })
        
        db.commit()
        return JSONResponse(
            content={"message": f"Successfully uploaded {len(uploaded_files)} files", "files": uploaded_files},
            status_code=200
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error uploading files: {str(e)}")
    finally:
        db.close()

@file_router.get("/list")
async def list_files(current_user: dict = Depends(get_current_user)):
    """
    Get list of files from database
    """
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("""
            SELECT file_id, file_name, file_path, uploaded_at
            FROM file_details 
            WHERE user_id = ?
        """, (current_user['id'],))
        
        files = [dict(row) for row in cursor.fetchall()]
        db.close()
        return JSONResponse(content={"files": files}, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing files: {str(e)}")

@file_router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete file from storage and database based on file_id
    """
    try:
        db = get_db()
        cursor = db.cursor()

        # First check if file exists and belongs to user
        cursor.execute("""
            SELECT file_path 
            FROM file_details 
            WHERE file_id = ? AND user_id = ?
        """, (file_id, current_user['id']))
        
        file = cursor.fetchone()
        if not file:
            raise HTTPException(status_code=404, detail="File not found or unauthorized")

        # Delete physical file
        if os.path.exists(file['file_path']):
            os.remove(file['file_path'])

        # Delete database record
        cursor.execute("""
            DELETE FROM file_details 
            WHERE file_id = ? AND user_id = ?
        """, (file_id, current_user['id']))
        
        db.commit()
        return JSONResponse(
            content={"message": "File deleted successfully"},
            status_code=200
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")
    finally:
        db.close()