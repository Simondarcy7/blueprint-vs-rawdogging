#!/usr/bin/env bash
set -euo pipefail

repo_url="${BLUEPRINT_VS_RAWDOGGING_REPO:-https://github.com/Simondarcy7/blueprint-vs-rawdogging.git}"
script_path="${BASH_SOURCE[0]:-$0}"
repo_root="$(cd "$(dirname "$script_path")" 2>/dev/null && pwd || pwd)"
tmp_repo=""
target="."
agent="both"
force=0
dry_run=0
with_docs=1
install_user_assets=0

cleanup() {
  if [[ -n "$tmp_repo" && -d "$tmp_repo" ]]; then
    rm -rf "$tmp_repo"
  fi
}
trap cleanup EXIT

usage() {
  cat <<'USAGE'
Blueprint vs Rawdogging installer

Usage:
  ./install.sh [--target DIR] [--agent codex|claude|both] [--force] [--dry-run] [--no-docs] [--install-user-assets]

Examples:
  ./install.sh --target ../my-new-app --agent both
  ./install.sh --target . --agent codex --dry-run
  ./install.sh --target . --agent claude --force

Options:
  --target DIR            Project directory to install into. Defaults to current directory.
  --agent VALUE           codex, claude, or both. Defaults to both.
  --force                 Overwrite existing files.
  --dry-run               Print actions without writing.
  --no-docs               Skip the optional reference library; required contract/planning files still install.
  --install-user-assets   Also install user-level Codex skills/agents into ~/.agents and ~/.codex.
  -h, --help              Show this help.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      target="${2:?--target requires a directory}"
      shift 2
      ;;
    --agent)
      agent="${2:?--agent requires codex, claude, or both}"
      shift 2
      ;;
    --force)
      force=1
      shift
      ;;
    --dry-run)
      dry_run=1
      shift
      ;;
    --no-docs)
      with_docs=0
      shift
      ;;
    --install-user-assets)
      install_user_assets=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

case "$agent" in
  codex|claude|both) ;;
  *)
    echo "--agent must be codex, claude, or both" >&2
    exit 1
    ;;
esac

say() {
  printf '%s\n' "$*"
}

run() {
  if [[ "$dry_run" -eq 1 ]]; then
    say "DRY RUN: $*"
  else
    "$@"
  fi
}

ensure_repo_root() {
  if [[ -f "$repo_root/templates/AGENTS.md" && -d "$repo_root/codex/skills" ]]; then
    return
  fi

  if ! command -v git >/dev/null 2>&1; then
    echo "This installer needs git when run from a remote URL." >&2
    echo "Install git, or clone the repository and run ./install.sh locally." >&2
    exit 1
  fi

  tmp_repo="$(mktemp -d)"
  say "Fetching toolkit source from $repo_url"
  git clone --depth 1 "$repo_url" "$tmp_repo" >/dev/null
  repo_root="$tmp_repo"
}

ensure_repo_root

target="$(cd "$(dirname "$target")" && pwd)/$(basename "$target")"

copy_file() {
  local src="$1"
  local dest="$2"
  if [[ -e "$dest" && "$force" -ne 1 ]]; then
    say "skip existing: $dest"
    return
  fi
  run mkdir -p "$(dirname "$dest")"
  run cp "$src" "$dest"
  say "installed: $dest"
}

copy_dir() {
  local src="$1"
  local dest="$2"
  if [[ -e "$dest" && "$force" -ne 1 ]]; then
    say "skip existing: $dest"
    return
  fi
  run mkdir -p "$(dirname "$dest")"
  if [[ "$dry_run" -eq 1 ]]; then
    say "DRY RUN: cp -R $src $dest"
  else
    rm -rf "$dest"
    cp -R "$src" "$dest"
  fi
  say "installed: $dest"
}

run mkdir -p "$target"
copy_file "$repo_root/BLUEPRINT.md" "$target/BLUEPRINT.md"
copy_file "$repo_root/templates/project-index.md" "$target/docs/project-index.md"
copy_file "$repo_root/templates/app-quality-contract.md" "$target/docs/app-quality-contract.md"
copy_file "$repo_root/templates/scripts/verify-blueprint.mjs" "$target/scripts/verify-blueprint.mjs"

if [[ "$with_docs" -eq 1 ]]; then
  copy_dir "$repo_root/docs" "$target/docs/foundation"
  copy_dir "$repo_root/templates" "$target/docs/foundation-templates"
fi

if [[ "$agent" == "codex" || "$agent" == "both" ]]; then
  copy_file "$repo_root/templates/AGENTS.md" "$target/AGENTS.md"
  copy_file "$repo_root/templates/src-modules-AGENTS.md" "$target/src/modules/AGENTS.md"
  copy_file "$repo_root/templates/src-services-AGENTS.md" "$target/src/services/AGENTS.md"
  copy_dir "$repo_root/codex/skills/mature-app-starter" "$target/.agents/skills/mature-app-starter"
  for skill_dir in "$repo_root"/codex/skills/*; do
    skill_name="$(basename "$skill_dir")"
    [[ "$skill_name" == "mature-app-starter" ]] && continue
    copy_dir "$skill_dir" "$target/.agents/skills/$skill_name"
  done
fi

if [[ "$agent" == "claude" || "$agent" == "both" ]]; then
  copy_file "$repo_root/templates/CLAUDE.md" "$target/CLAUDE.md"
  copy_file "$repo_root/templates/src-modules-AGENTS.md" "$target/src/modules/CLAUDE.md"
  copy_file "$repo_root/templates/src-services-AGENTS.md" "$target/src/services/CLAUDE.md"
  copy_dir "$repo_root/codex/skills/mature-app-starter" "$target/.claude/skills/mature-app-starter"
  for skill_dir in "$repo_root"/codex/skills/*; do
    skill_name="$(basename "$skill_dir")"
    [[ "$skill_name" == "mature-app-starter" ]] && continue
    copy_dir "$skill_dir" "$target/.claude/skills/$skill_name"
  done
  copy_dir "$repo_root/claude/commands" "$target/.claude/commands"
  copy_file "$repo_root/templates/claude/settings.json" "$target/.claude/settings.json"
fi

if [[ "$install_user_assets" -eq 1 ]]; then
  copy_dir "$repo_root/codex/skills/mature-app-starter" "$HOME/.agents/skills/mature-app-starter"
  for skill_dir in "$repo_root"/codex/skills/*; do
    skill_name="$(basename "$skill_dir")"
    [[ "$skill_name" == "mature-app-starter" ]] && continue
    copy_dir "$skill_dir" "$HOME/.agents/skills/$skill_name"
  done
  run mkdir -p "${CODEX_HOME:-$HOME/.codex}/agents"
  for agent_file in "$repo_root"/codex/agents/*.toml; do
    copy_file "$agent_file" "${CODEX_HOME:-$HOME/.codex}/agents/$(basename "$agent_file")"
  done
fi

say ""
say "Done. Installed Blueprint vs Rawdogging into: $target"
say "Agent target: $agent"
say "Read BLUEPRINT.md, complete the planning records, then implement the Expo foundation."
say "Run node scripts/verify-blueprint.mjs after setup; installation alone is not a passing app."
say "Existing files/directories are skipped unless --force is used; review skipped files before claiming adoption."
if [[ "$dry_run" -eq 1 ]]; then
  say "Dry-run only; no files were changed."
fi
