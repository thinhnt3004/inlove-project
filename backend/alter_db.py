from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        sql = """
        IF NOT EXISTS (
            SELECT * FROM sys.columns 
            WHERE Name = N'Passcode' AND Object_ID = Object_ID(N'TimeCapsules')
        )
        BEGIN
            ALTER TABLE TimeCapsules ADD Passcode NVARCHAR(50) NULL;
        END
        """
        conn.execute(text(sql))
        conn.commit()
        print("Updated database tables!")
    except Exception as e:
        print("Error:", e)

