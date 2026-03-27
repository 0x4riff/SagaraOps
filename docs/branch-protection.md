# Branch Protection Baseline (main)

Recommended settings for `main` to keep SagaraOps stable and secure.

## Rule Target

- Branch name pattern: `main`

## Recommended Protections

1. **Require a pull request before merging**
   - Require approvals: `1`
   - Dismiss stale approvals when new commits are pushed: `enabled`
   - Require review from Code Owners: `enabled`

2. **Require status checks to pass before merging**
   - Require branches to be up to date: `enabled`
   - Required checks:
     - `CI / api-worker-check`
     - `CI / web-check`
     - `Analyze (python)`
     - `Analyze (javascript-typescript)`

3. **Restrict direct pushes**
   - Include administrators: `enabled`
   - Do not allow force pushes: `enabled`
   - Do not allow deletions: `enabled`

4. **Require conversation resolution before merging**
   - `enabled`

5. **Lock branch (optional for release windows)**
   - Keep `disabled` for normal development

## Setup Steps (GitHub UI)

1. Repo → **Settings** → **Branches**
2. Add branch protection rule for `main`
3. Enable items above
4. Save

## Notes

- After enabling CodeQL, run at least one successful scan so those checks can be selected.
- If check names differ, use the exact names shown in the latest Actions run.
