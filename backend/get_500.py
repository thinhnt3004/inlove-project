import urllib.request
from urllib.error import HTTPError
try:
    urllib.request.urlopen('http://127.0.0.1:8080/api/couple/B878EFC3-B1B6-4A59-A67C-3EBA1ADBD178/messages')
    print("Success")
except HTTPError as e:
    print(e.read().decode())
