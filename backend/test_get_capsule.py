import urllib.request
import json
req = urllib.request.Request("http://127.0.0.1:8080/api/couple/123/capsules")
try:
    response = urllib.request.urlopen(req)
    print("Response:", response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print("Details:", e.read().decode('utf-8'))
