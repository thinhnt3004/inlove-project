from app.database import SessionLocal
from app import models, schemas
import traceback

db = SessionLocal()
couple = db.query(models.Couple).first()
if couple:
    try:
        capsules = db.query(models.TimeCapsule).filter(models.TimeCapsule.CoupleID == couple.CoupleID).order_by(models.TimeCapsule.OpenDate.asc()).all()
        for cap in capsules:
            if not cap.IsOpened:
                cap.Message = ''
            
            # test serialization
            res = schemas.TimeCapsuleResponse.model_validate(cap)
            print('Validated', res.CapsuleID)
    except Exception as e:
        traceback.print_exc()
