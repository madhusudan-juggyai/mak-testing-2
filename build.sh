#!/bin/bash

# Install dependencies
npm install

# Navigate to frontend directory and install frontend dependencies
cd frontend || exit
npm install

# Copy environment file
cp .env.example .env

# Build the React app
npm run build

# Navigate back to root
cd ..
