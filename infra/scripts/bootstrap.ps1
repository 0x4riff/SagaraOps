Write-Host "[SagaraOps] Bootstrap starting..."
Copy-Item -Path ..\..\.env.example -Destination ..\..\.env -Force -ErrorAction SilentlyContinue
Write-Host "[SagaraOps] .env prepared (if not exists, edit manually)."
Write-Host "[SagaraOps] Next: docker compose -f infra/docker/docker-compose.yml up -d"
