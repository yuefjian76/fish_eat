lsof -ti:8080 | xargs kill 2>/dev/null; python3 -m http.server 8080 &
