#!/usr/bin/env bash
# Antigravity Elite Harness - macOS / Linux Installer
set -e

echo "⚡ Installing Antigravity Elite Harness..."

GEMINI_DIR="$HOME/.gemini"
CONFIG_SKILLS_DIR="$GEMINI_DIR/config/skills"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create directories
mkdir -p "$CONFIG_SKILLS_DIR/ui-design-system"
mkdir -p "$CONFIG_SKILLS_DIR/code-review"
mkdir -p "$CONFIG_SKILLS_DIR/architect-planner"

# Copy Rules
cp "$SCRIPT_DIR/AGENTS.md" "$GEMINI_DIR/AGENTS.md"
echo "✔ Installed global rules -> ~/.gemini/AGENTS.md"

# Copy Skills
cp "$SCRIPT_DIR/skills/ui-design-system/SKILL.md" "$CONFIG_SKILLS_DIR/ui-design-system/SKILL.md"
echo "✔ Installed skill -> ui-design-system"

cp "$SCRIPT_DIR/skills/code-review/SKILL.md" "$CONFIG_SKILLS_DIR/code-review/SKILL.md"
echo "✔ Installed skill -> code-review"

cp "$SCRIPT_DIR/skills/architect-planner/SKILL.md" "$CONFIG_SKILLS_DIR/architect-planner/SKILL.md"
echo "✔ Installed skill -> architect-planner"

echo -e "\n🎉 Installation complete! Restart or reload Antigravity to activate."
