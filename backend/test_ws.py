import asyncio
import websockets

async def test_ws():
    uri = 'wss://my-inlove.onrender.com/api/ws/chat/123'
    try:
        async with websockets.connect(uri) as ws:
            print('Connected!')
            await asyncio.sleep(1)
            print('Still connected!')
            await ws.send('{"Action": "PING"}')
            res = await ws.recv()
            print('Received:', res)
    except Exception as e:
        print('Error:', e)

asyncio.run(test_ws())
