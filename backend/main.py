from fastapi import FastAPI

# Inicjalizacja aplikacji
app = FastAPI()

# Główny endpoint (np. żeby sprawdzić w przeglądarce czy działa)
@app.get("/")
def read_root():
    return {"message": "Witaj! Backend w Pythonie działa na Renderze!"}

# Endpoint dla cron-job.org (Health Check)
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Serwer nie śpi!"}