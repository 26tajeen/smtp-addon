#!/usr/bin/with-contenv bashio

# Start Postfix
postfix start

# Run the Node.js application
node /usr/src/app/dist/index.js