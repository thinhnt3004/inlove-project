from app.database import SessionLocal
from app import models
import urllib.request
import json

db = SessionLocal()
couple = db.query(models.Couple).first()
if not couple:
    print('No couple found')
else:
    couple_id_str = str(couple.CoupleID)
    print("Testing with CoupleID:", couple_id_str)
    
    req = urllib.request.Request("http://127.0.0.1:8080/api/couple/" + couple_id_str + "/capsules")
    try:
        response = urllib.request.urlopen(req)
        print("Response:", response.read().decode('utf-8'))
    except Exception as e:
        print("Error:", e)
        if hasattr(e, 'read'):
            print("Details:", e.read().decode('utf-8'))
