from app.database import engine
from sqlalchemy import text

def run_migration():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE Messages ADD Reaction NVARCHAR(50) NULL;"))
            print("Added Reaction column.")
        except Exception as e:
            print("Reaction column might already exist.", e)
            
        try:
            conn.execute(text("ALTER TABLE Messages ADD IsDeleted BIT DEFAULT 0;"))
            print("Added IsDeleted column.")
        except Exception as e:
            print("IsDeleted column might already exist.", e)
            
        try:
            conn.execute(text("ALTER TABLE Messages ADD ReplyToID UNIQUEIDENTIFIER NULL FOREIGN KEY REFERENCES Messages(MessageID);"))
            print("Added ReplyToID column.")
        except Exception as e:
            print("ReplyToID column might already exist.", e)

if __name__ == "__main__":
    run_migration()
