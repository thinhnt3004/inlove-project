from app.database import engine, SQLALCHEMY_DATABASE_URL
from sqlalchemy import text
import sys

def main():
    print(f"Connecting to {SQLALCHEMY_DATABASE_URL}...")
    try:
        with engine.connect() as conn:
            # Change column type to NVARCHAR to support Unicode emojis
            conn.execute(text("ALTER TABLE Users ALTER COLUMN Mood NVARCHAR(50)"))
            # Reset existing invalid moods
            conn.execute(text("UPDATE Users SET Mood = NULL WHERE Mood = '??'"))
            conn.commit()
            print("Successfully updated Mood column to NVARCHAR and reset invalid values!")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
