# Ralph Wiggum Loop (PowerShell v5) — feeds prompts to Claude with fresh context per iteration.
# Progress lives in files and git, not LLM memory.
#
# Usage:
#   .\loop.ps1 plan [max_iterations]
#   .\loop.ps1 build [max_iterations]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('plan','build')]
    [string]$Mode,

    [Parameter(Mandatory=$false)]
    [int]$Max = 0
)

$ErrorActionPreference = 'Stop'

$PromptFile = "PROMPT_$Mode.md"

if (-not (Test-Path $PromptFile)) {
    Write-Error "Error: $PromptFile not found"
    exit 1
}

$Iteration = 0

while ($true) {
    $Iteration++

    if ($Max -gt 0 -and $Iteration -gt $Max) {
        Write-Host "Reached max iterations ($Max). Stopping."
        break
    }

    Write-Host ""
    Write-Host "========================================="
    Write-Host "  Iteration $Iteration — mode: $Mode"
    Write-Host "========================================="
    Write-Host ""

    # Fresh Claude invocation each iteration — no carried-over context
    Get-Content $PromptFile | claude -p --model sonnet --allowedTools "Bash(npm run:*)" "Bash(npx *)" "Read" "Write" "Edit" "Glob" "Grep"

    # Auto-commit any changes
    $Status = git status --porcelain
    if ($Status) {
        git add -A
        git commit -m "ralph($Mode): iteration $Iteration`n`nAutomated commit from loop.ps1 $Mode mode."
        Write-Host "Committed iteration $Iteration changes."
    } else {
        Write-Host "No changes in iteration $Iteration."
    }

    # Brief pause between iterations
    Start-Sleep -Seconds 2
}
