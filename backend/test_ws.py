import asyncio
import websockets

async def test():
    uri = "ws://127.0.0.1:8080/api/ws/chat/test"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected")
            await websocket.send('{"SenderID": "test", "Content": "hello"}')
            print("Sent")
            response = await websocket.recv()
            print("Received:", response)
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
