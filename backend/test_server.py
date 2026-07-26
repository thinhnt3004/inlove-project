from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app import models
import traceback

client = TestClient(app, raise_server_exceptions=True)
db = SessionLocal()
couple = db.query(models.Couple).first()
if couple:
    couple_id = str(couple.CoupleID)
    try:
        response = client.get('/api/couple/' + couple_id + '/capsules')
        print(response.status_code, response.text)
    except Exception as e:
        traceback.print_exc()
