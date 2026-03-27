import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine
# Import models so SQLModel registers them
from app.models import Organization, Employee, Project, Task, Allocation

def reset_database():
    load_dotenv("../.env")
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found in ../.env")
        return

    print(f"Connecting to {db_url}")
    engine = create_engine(db_url)
    
    print("Dropping all tables...")
    SQLModel.metadata.drop_all(engine)
    
    print("Creating fresh tables...")
    SQLModel.metadata.create_all(engine)
    
    print("Database reset successfully! All mock data has been cleared.")

if __name__ == "__main__":
    reset_database()
