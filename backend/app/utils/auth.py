import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session
import os
import bcrypt

from ..database import get_session
from ..models import Organization, Employee

# Use raw bcrypt to bypass passlib 72-byte checking bug on bcrypt>=4.0
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-super-secret-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), session: Session = Depends(get_session)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        role = payload.get("role")
        if user_id_str is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid auth token payload (missing sub or role)")
        user_id = int(user_id_str)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError as e:
        print(f"JWT Decode failed: {e}. Token was: {token}")
        raise HTTPException(status_code=401, detail=f"Token validation failed: {str(e)}")

    if role == "org":
        user = session.get(Organization, user_id)
        if user is None:
            raise HTTPException(status_code=404, detail="Organization not found")
        # Remove dynamic assignment because Pydantic v2 rejects arbitrary attributes
        return user
    elif role == "employee":
        user = session.get(Employee, user_id)
        if user is None:
            raise HTTPException(status_code=404, detail="Employee not found")
        return user
    else:
        raise HTTPException(status_code=401, detail="Invalid role in token")

def get_current_org(current_user = Depends(get_current_user)):
    """Enforces that the caller is an Organization."""
    if not isinstance(current_user, Organization):
         raise HTTPException(status_code=403, detail="Not authorized. Organization access required.")
    return current_user

def get_current_employee(current_user = Depends(get_current_user)):
    """Enforces that the caller is an Employee."""
    if not isinstance(current_user, Employee):
         raise HTTPException(status_code=403, detail="Not authorized. Employee access required.")
    return current_user
