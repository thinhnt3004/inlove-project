from sqlalchemy import create_engine
from app.database import SQLALCHEMY_DATABASE_URL
from sqlalchemy import text

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def add_mood_column():
    try:
        with engine.connect() as connection:
            connection.execute(text("ALTER TABLE Users ADD Mood NVARCHAR(50) NULL;"))
            connection.commit()
            print("Successfully added Mood column to Users table!")
    except Exception as e:
        print(f"Error adding column (it might already exist): {e}")

if __name__ == "__main__":
    add_mood_column()
