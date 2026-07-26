import asyncio
import websockets
import json

async def test():
    uri = "ws://127.0.0.1:8080/api/ws/chat/B878EFC3-B1B6-4A59-A67C-3EBA1ADBD178"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected")
            # Need a valid SenderID too. Let's query db for User1.
            from app.database import SessionLocal
            from app.models import Couple
            db = SessionLocal()
            couple = db.query(Couple).first()
            sender_id = str(couple.User1ID)
            db.close()
            
            payload = json.dumps({"SenderID": sender_id, "Content": "test message"})
            await websocket.send(payload)
            print("Sent")
            response = await websocket.recv()
            print("Received:", response)
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
