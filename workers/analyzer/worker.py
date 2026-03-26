import os
import time

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")


def main():
    print("[worker] SagaraOps analyzer worker started")
    print(f"[worker] redis={REDIS_URL}")
    print(f"[worker] ollama={OLLAMA_BASE_URL} model={OLLAMA_MODEL}")

    # TODO: poll queue, parse sosreport, run AI summarization, save results
    while True:
        print("[worker] heartbeat: waiting for jobs...")
        time.sleep(30)


if __name__ == "__main__":
    main()
