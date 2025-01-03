#!/bin/bash
PORT=5000  # Change this to your desired port
PID=$(lsof -t -i:$PORT)
if [ -n "$PID" ]; then
    echo "Killing process on port $PORT (PID: $PID)"
    kill -9 $PID
else
    echo "No process found on port $PORT"
fi
