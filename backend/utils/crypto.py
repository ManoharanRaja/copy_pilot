from cryptography.fernet import Fernet

ENCRYPTION_KEY = b'kQv3w7l9v8QvK5gkK8kQvK5gkK8kQvK5gkK8kQvK5gk='  # Replace with your actual key

def generate_key():
    return Fernet.generate_key()

def encrypt(data: str, key: bytes) -> str:
    fernet = Fernet(key)
    encrypted_data = fernet.encrypt(data.encode())
    return encrypted_data.decode()

def decrypt(encrypted_data: str, key: bytes) -> str:
    fernet = Fernet(key)
    decrypted_data = fernet.decrypt(encrypted_data.encode()).decode()
    return decrypted_data