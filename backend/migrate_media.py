from app.database import engine
from sqlalchemy import text

def run_migration():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE Messages ADD MediaUrl NVARCHAR(MAX) NULL;"))
            print("Added MediaUrl column.")
        except Exception as e:
            print("MediaUrl column might already exist.", e)
            
        try:
            conn.execute(text("ALTER TABLE Messages ADD MediaType NVARCHAR(50) NULL;"))
            print("Added MediaType column.")
        except Exception as e:
            print("MediaType column might already exist.", e)
            
        try:
            conn.execute(text("ALTER TABLE Messages ALTER COLUMN Content NVARCHAR(MAX) NULL;"))
            print("Altered Content column to be NULLable.")
        except Exception as e:
            print("Content column already NULLable or error.", e)

if __name__ == "__main__":
    run_migration()
