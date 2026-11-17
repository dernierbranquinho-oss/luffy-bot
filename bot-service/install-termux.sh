#!/data/data/com.termux/files/usr/bin/sh
set -eu
pkg install -y nodejs-lts python make clang
npm install
if [ ! -f .env ]; then cp .env.example .env; chmod 600 .env; fi
mkdir -p session data
chmod 700 session data
printf '\nConfigure .env antes de executar npm start. Nunca partilhe a sessão.\n'
