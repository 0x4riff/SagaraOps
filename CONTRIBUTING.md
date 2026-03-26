# Contributing to SagaraOps

Thanks for your interest in improving SagaraOps 🚀

This project demonstrates DevOps + Fullstack practices around SOS report automation.
Please follow this guide to keep contributions consistent and reviewable.

## Ground Rules

- Be respectful and follow our [Code of Conduct](.github/CODE_OF_CONDUCT.md)
- Prefer small, focused PRs over large mixed changes
- Open an issue first for large features or architecture changes

## Development Setup

```bash
# from repo root
cp .env.example .env
cd infra/docker
docker compose up -d --build
```

Services:
- Web: http://localhost:3000
- API: http://localhost:8000

## Branch Naming

Use clear prefixes:
- `feat/<short-topic>`
- `fix/<short-topic>`
- `docs/<short-topic>`
- `chore/<short-topic>`

## Commit Messages

Use Conventional Commits style:
- `feat: add queue retry strategy`
- `fix(api): handle missing upload file`
- `docs: update architecture diagram`

## Pull Request Checklist

Before opening a PR:
- [ ] CI passes
- [ ] Scope is focused and documented
- [ ] README/docs updated (if behavior changed)
- [ ] No secrets committed

## Reporting Bugs

Please include:
- Steps to reproduce
- Expected vs actual behavior
- Logs/screenshots if relevant
- Environment info (OS, Docker version)

## Suggesting Features

Open a GitHub issue with:
- Problem statement
- Proposed solution
- Alternatives considered
- Impact on existing users/workflow

## Security Issues

Please **do not** open public issues for vulnerabilities.
Follow [SECURITY.md](SECURITY.md) for responsible disclosure.
