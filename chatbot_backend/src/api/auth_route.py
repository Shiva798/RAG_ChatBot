from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status, Body, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from src.database import get_db

# --- Configuration ---
SECRET_KEY = "e4f8ad8da557b7078034a91df0ee1d0cab556c7230a70d147c7d7fe90c56d8eb"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# --- Password hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto",bcrypt__rounds=12)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/oauth_token")

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class PasswordUpdate(BaseModel):
    identifier: str  
    new_password: str

class UserLogin(BaseModel):
    username: str
    password: str

class DeleteUser(BaseModel):
    identifier: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

auth_router = APIRouter(prefix="/auth", tags=["AUTH"])

def get_user_by_identifier(db, identifier):
    cursor = db.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE username = ? OR email = ?", (identifier, identifier)
    )
    return cursor.fetchone()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, 
            SECRET_KEY, 
            algorithms=[ALGORITHM],
            options={"verify_exp": True, "leeway": 0}
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user_by_identifier(db, username)
    if not user:
        raise credentials_exception
    return user

@auth_router.get("/all_users")
def get_all_users(db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id, username, email, hashed_password FROM users")
    users = [dict(row) for row in cursor.fetchall()]
    return {"users": users}

@auth_router.post("/create_user", status_code=201)
def register_user(user: UserCreate, db=Depends(get_db)):
    cursor = db.cursor()
    # Check if user exists
    cursor.execute("SELECT * FROM users WHERE username = ? OR email = ?", (user.username, user.email))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Username or email already exists")
    hashed_password = pwd_context.hash(user.password)
    cursor.execute(
        "INSERT INTO users (username, email, hashed_password) VALUES (?, ?, ?)",
        (user.username, user.email, hashed_password)
    )
    db.commit()
    return {"response": "User created successfully"}

@auth_router.delete("/delete_user")
def delete_user(
    data: DeleteUser = Body(...),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("DELETE FROM users WHERE username = ? OR email = ?", (data.identifier, data.identifier))
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"response": "User deleted successfully"}

@auth_router.post("/oauth_token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (form_data.username,))
    db_user = cursor.fetchone()
    if not db_user or not pwd_context.verify(form_data.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    access_token = create_access_token(data={"sub": db_user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@auth_router.post("/login_user")
def login(user: UserLogin, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (user.username,))
    db_user = cursor.fetchone()
    if not db_user or not pwd_context.verify(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"response": "Login successful"}

@auth_router.put("/password_modification")
def update_password(data: PasswordUpdate, db=Depends(get_db)):
    user = get_user_by_identifier(db, data.identifier)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    hashed_password = pwd_context.hash(data.new_password)
    cursor = db.cursor()
    cursor.execute(
        "UPDATE users SET hashed_password = ? WHERE username = ? OR email = ?",
        (hashed_password, data.identifier, data.identifier)
    )
    db.commit()
    return {"response": "Password updated successfully"}

@auth_router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db=Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    # Check if user exists
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (request.email,))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate a reset token (valid for 10 minutes)
    reset_token = create_access_token(
        data={"sub": request.email},
        expires_delta=timedelta(minutes=10)
    )
    db.commit()

    return {
        "response": "Password reset token generated.",
        "reset_token": reset_token
    }

@auth_router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db=Depends(get_db)):
    try:
        payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=400, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    cursor = db.cursor()
    hashed_password = pwd_context.hash(request.new_password)
    cursor.execute(
        "UPDATE users SET hashed_password = ? WHERE email = ?",
        (hashed_password, email)
    )
    db.commit()
    return {"response": "Password reset successful"}
