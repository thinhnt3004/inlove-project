from app.database import SessionLocal
from app import models
import traceback

db = SessionLocal()
couple = db.query(models.Couple).first()
if not couple:
    print('No couple found')
else:
    try:
        capsules = db.query(models.TimeCapsule).filter(models.TimeCapsule.CoupleID == couple.CoupleID).order_by(models.TimeCapsule.OpenDate.asc()).all()
        for cap in capsules:
            print(cap.Title, cap.Message, cap.IsOpened)
    except Exception as e:
        traceback.print_exc()
