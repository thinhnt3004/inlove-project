import urllib.request
from app.database import SessionLocal
from app import models
import time

db = SessionLocal()
couple = db.query(models.Couple).first()
if couple:
    couple_id = str(couple.CoupleID)
    try:
        response = urllib.request.urlopen("http://127.0.0.1:8081/api/couple/" + couple_id + "/capsules")
        print(response.status_code, response.read().decode())
    except Exception as e:
        if hasattr(e, 'read'):
            print(e.read().decode())
        else:
            print(e)
