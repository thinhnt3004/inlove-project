from app.database import SessionLocal
from app import models
import uuid
from datetime import datetime

db = SessionLocal()
couple = db.query(models.Couple).first()
if not couple:
    print('No couple found')
else:
    try:
        new_cap = models.TimeCapsule(
            CoupleID=couple.CoupleID,
            Title='Test',
            Message='Msg',
            OpenDate=datetime.utcnow(),
            IsOpened=False
        )
        db.add(new_cap)
        db.commit()
        print('Success')
    except Exception as e:
        print('Error:', e)
