import os
from cryptography.fernet import Fernet

FERNET_KEY = os.environ["FERNET_KEY"]
fernet = Fernet(FERNET_KEY)

def encrypt(s: str) -> str:
    return fernet.encrypt(s.encode()).decode()

def decrypt(s: str) -> str:
    return fernet.decrypt(s.encode()).decode()
