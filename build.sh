#!/bin/bash

cd frontend
npm install
cp .env.example .env
npm run build
cd ..
