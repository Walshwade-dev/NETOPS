#!/usr/bin/env bash
# NETOPS Service & Simulation Demo Manager
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="${PROJECT_DIR}/.demo-pids"
BACKEND_LOG="${PROJECT_DIR}/backend-demo.log"
FRONTEND_LOG="${PROJECT_DIR}/frontend-demo.log"
ACTION="${1:-status}"

seed_simulation() {
    echo "🌱 Seeding NETOPS Simulation Mode devices (RFC 5737 TEST-NET-1: 192.0.2.0/24)..."
    RESPONSE=$(curl -s -X POST http://localhost:8000/simulation/seed)
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
}

case "$ACTION" in
    demo)
        echo "🚀 Launching NETOPS 1-Command Simulation Mode..."
        cd "$PROJECT_DIR"

        # Stop any previously running demo processes
        if [ -f "$PID_FILE" ]; then
            "$0" demo-stop >/dev/null 2>&1 || true
        fi

        # 1. Start FastAPI Backend on port 8000
        echo "  [1/3] Starting FastAPI Backend on http://localhost:8000 ..."
        PYTHONPATH="$PROJECT_DIR" nohup "$PROJECT_DIR/.venv/bin/uvicorn" backend.app.main:app \
            --host 0.0.0.0 --port 8000 > "$BACKEND_LOG" 2>&1 &
        BACKEND_PID=$!

        # 2. Start React 19 + Vite Frontend on port 5173
        echo "  [2/3] Starting React 19 Vite Console on http://localhost:5173 ..."
        (cd "$PROJECT_DIR/frontend" && nohup npm run dev -- --host 0.0.0.0 --port 5173 > "$FRONTEND_LOG" 2>&1 &)
        sleep 0.3
        FRONTEND_PID=$(pgrep -f "vite.*5173" | head -n 1 || echo "")

        echo "${BACKEND_PID} ${FRONTEND_PID}" > "$PID_FILE"

        # Wait for backend health check
        echo -n "  ⏳ Waiting for FastAPI /health endpoint"
        for _ in {1..25}; do
            if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
                echo " ✅ Ready!"
                break
            fi
            echo -n "."
            sleep 0.4
        done

        # 3. Seed Simulation Devices
        echo "  [3/3] Seeding fictional LAN devices (Zero hardware required)..."
        seed_simulation

        echo ""
        echo "=================================================================="
        echo "✅ NETOPS Simulation Mode is LIVE!"
        echo "   🌐 Web Dashboard : http://localhost:5173"
        echo "   📘 Swagger API   : http://localhost:8000/docs"
        echo "   🛑 Stop Demo     : ./netops.sh demo-stop"
        echo "=================================================================="
        ;;
    demo-stop)
        echo "🛑 Stopping NETOPS standalone demo processes..."
        if [ -f "$PID_FILE" ]; then
            read -r BACKEND_PID FRONTEND_PID < "$PID_FILE" || true
            kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
            rm -f "$PID_FILE"
        fi
        pkill -f "uvicorn backend.app.main:app" 2>/dev/null || true
        pkill -f "vite.*5173" 2>/dev/null || true
        echo "✅ Standalone demo stopped."
        ;;
    seed)
        seed_simulation
        ;;
    test)
        echo "🧪 Running NETOPS automated pytest suite..."
        cd "$PROJECT_DIR"
        PYTHONPATH="$PROJECT_DIR" "$PROJECT_DIR/.venv/bin/pytest" backend/tests/ -v
        ;;
    start)
        echo "Starting NETOPS systemd services..."
        sudo systemctl start netops-backend netops-frontend netops-agent
        echo "Services started."
        ;;
    stop)
        echo "Stopping NETOPS systemd services..."
        sudo systemctl stop netops-frontend netops-backend netops-agent
        echo "Services stopped."
        ;;
    restart)
        echo "Restarting NETOPS systemd services..."
        sudo systemctl restart netops-backend netops-frontend netops-agent
        echo "Services restarted."
        ;;
    status)
        echo "=== NETOPS Services Status ==="
        if [ -f "$PID_FILE" ]; then
            echo "🟢 Standalone Demo Mode PIDs: $(cat "$PID_FILE")"
        fi
        systemctl status netops-backend netops-frontend netops-agent --no-pager || true
        ;;
    logs)
        SERVICE="${2:-backend}"
        sudo journalctl -u "netops-${SERVICE}" -f
        ;;
    open)
        xdg-open http://localhost:5173 2>/dev/null || sensible-browser http://localhost:5173
        ;;
    *)
        echo "Usage: $0 {demo|demo-stop|seed|test|start|stop|restart|status|logs [backend|frontend|agent]|open}"
        exit 1
        ;;
esac
