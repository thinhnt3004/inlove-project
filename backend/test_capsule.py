import urllib.request
import json

data = json.dumps({"Title": "Test", "Message": "Hello", "OpenDate": "2027-01-01T00:00:00"}).encode('utf-8')
req = urllib.request.Request("http://127.0.0.1:8080/api/couple/123/capsules", data=data, headers={'Content-Type': 'application/json'})
try:
    response = urllib.request.urlopen(req)
    print("Response:", response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print("Details:", e.read().decode('utf-8'))
