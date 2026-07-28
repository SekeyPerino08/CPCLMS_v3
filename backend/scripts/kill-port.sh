#!/usr/bin/env bash
# ============================================================
# kill-port.sh — Cross-platform Bash script to kill process on a port
#
# Usage:
#   ./kill-port.sh            # Reads PORT from ../.env or defaults to 4000
#   ./kill-port.sh 3000       # Kills whatever is on port 3000
# ============================================================

set -euo pipefail

# --- Determine port ---------------------------------------------------------
PORT="${1:-}"

if [ -z "$PORT" ]; then
  # Try reading from ../.env (scripts are in backend/scripts/)
  ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env"
  if [ -f "$ENV_FILE" ]; then
    FOUND_PORT="$(grep -oP '^PORT=\K\d+' "$ENV_FILE" || true)"
    if [ -n "$FOUND_PORT" ]; then
      PORT="$FOUND_PORT"
      echo "[INFO] Read PORT=$PORT from $ENV_FILE"
    fi
  fi
fi

if [ -z "$PORT" ]; then
  PORT=4000
  echo "[INFO] No PORT found, defaulting to $PORT"
fi

echo "------------------------------------------------------------"
echo "  Looking for process listening on port $PORT ..."
echo "------------------------------------------------------------"

PID=""

# --- Strategy 1: ss (fast, modern Linux) -----------------------------------
if command -v ss &>/dev/null; then
  PID=$(ss -tlnp "sport = :$PORT" 2>/dev/null | awk 'NR>1 {gsub(/.*pid=/, "", $NF); gsub(/,.*/, "", $NF); print $NF}' | head -1)
  if [ -n "$PID" ]; then
    echo "[DETECT] Found PID $PID via ss"
  fi
fi

# --- Strategy 2: lsof (macOS, Linux) ----------------------------------------
if [ -z "$PID" ] && command -v lsof &>/dev/null; then
  PID=$(lsof -ti :"$PORT" 2>/dev/null | head -1)
  if [ -n "$PID" ]; then
    echo "[DETECT] Found PID $PID via lsof"
  fi
fi

# --- Strategy 3: netstat (fallback) -----------------------------------------
if [ -z "$PID" ] && command -v netstat &>/dev/null; then
  if netstat -tlnp 2>/dev/null | awk -v port=":$PORT" '$4 ~ port {print $NF}' | grep -q .; then
    PID=$(netstat -tlnp 2>/dev/null | awk -v port=":$PORT" '$4 ~ port {gsub(/\/.*/, "", $NF); print $NF}' | head -1)
    if [ -n "$PID" ]; then
      echo "[DETECT] Found PID $PID via netstat"
    fi
  fi
fi

# --- Action -----------------------------------------------------------------
if [ -z "$PID" ]; then
  echo "[OK] No process found listening on port $PORT — nothing to do."
  exit 0
fi

echo "[KILL] Killing PID $PID ..."
if kill -9 "$PID" 2>/dev/null; then
  echo "[DONE] Process $PID on port $PORT has been terminated."
else
  echo "[WARN] Could not kill PID $PID (permission or already dead)."
fi

