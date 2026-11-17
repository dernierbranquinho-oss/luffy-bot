# LUFFY SOLUTIONS BOT service

See `../public/setup-guide.txt` for server, Termux and APK setup. Node.js 20+ required. This directory is independently installed and never imported into the hosted application.

Authentication validates the Cloud account with `getUser(token)` on every private request and permits only `ADMIN_USER_ID`. Set an exact HTTPS `APP_ORIGIN`. Keep `.env`, `data/`, and `session/` outside version control; review your export before sharing.

SQLite uses WAL. Back up the database and the credentials directory on an encrypted persistent volume. Inbound deduplication reserves a message ID before processing; ambiguous or failed sends are recorded and are not automatically resent. Responses marked sent indicate send completion, not recipient delivery or read status. No connection status, QR or pairing code is simulated.
