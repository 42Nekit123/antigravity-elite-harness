# Antigravity Elite Harness - Windows Installer
$ErrorActionPreference = "Stop"

Write-Host "⚡ Installing Antigravity Elite Harness..." -ForegroundColor Cyan

$homeDir = $env:USERPROFILE
$geminiDir = Join-Path $homeDir ".gemini"
$configSkillsDir = Join-Path $geminiDir "config\skills"

# Create directories
New-Item -ItemType Directory -Path (Join-Path $configSkillsDir "ui-design-system") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $configSkillsDir "code-review") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $configSkillsDir "architect-planner") -Force | Out-Null

$scriptDir = $PSScriptRoot

# Copy Rules
Copy-Item (Join-Path $scriptDir "AGENTS.md") (Join-Path $geminiDir "AGENTS.md") -Force
Write-Host "✔ Installed global rules -> ~/.gemini/AGENTS.md" -ForegroundColor Green

# Copy Skills
Copy-Item (Join-Path $scriptDir "skills\ui-design-system\SKILL.md") (Join-Path $configSkillsDir "ui-design-system\SKILL.md") -Force
Write-Host "✔ Installed skill -> ui-design-system" -ForegroundColor Green

Copy-Item (Join-Path $scriptDir "skills\code-review\SKILL.md") (Join-Path $configSkillsDir "code-review\SKILL.md") -Force
Write-Host "✔ Installed skill -> code-review" -ForegroundColor Green

Copy-Item (Join-Path $scriptDir "skills\architect-planner\SKILL.md") (Join-Path $configSkillsDir "architect-planner\SKILL.md") -Force
Write-Host "✔ Installed skill -> architect-planner" -ForegroundColor Green

Write-Host "`n🎉 Installation complete! Restart or reload Antigravity to activate." -ForegroundColor Yellow
