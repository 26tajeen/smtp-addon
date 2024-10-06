ARG BUILD_FROM
FROM $BUILD_FROM

# Install Node.js, npm, and other dependencies
RUN apk add --no-cache nodejs npm postfix

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json from the subdirectory
COPY smtp-email-aggregator/package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy the rest of the application from the subdirectory
COPY smtp-email-aggregator .

# Debug: List files in src directory
RUN ls -la src

# Debug: Show content of index.ts
RUN cat src/index.ts

# Debug: Show TypeScript version
RUN npx tsc --version

# Debug: Show TypeScript compiler options
RUN npx tsc --showConfig

# Attempt to build the TypeScript project and capture output
RUN npm run build > build_output.log 2>&1 || (cat build_output.log && exit 1)

# If build succeeds, remove devDependencies
RUN npm prune --production

# Copy the run script
COPY run.sh /

RUN chmod a+x /run.sh

CMD [ "/run.sh" ]