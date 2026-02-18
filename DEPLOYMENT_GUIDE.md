# Deployment Guide

This guide covers how to install, build, and deploy the Entry Fleet Management Dashboard.

## Table of Contents

- [Requirements](#requirements)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Production Build](#production-build)
- [Deployment Platforms](#deployment-platforms)
  - [Vercel](#vercel)
  - [Netlify](#netlify)
  - [Railway](#railway)

---

## Requirements

- **Node.js**: v16.x or higher (tested with v24.x)
- **npm**: v8.x or higher

> **Note**: This project uses Create React App with `react-scripts@4.0.3`, which requires the `--openssl-legacy-provider` flag for Node.js 17+. This is already configured in the npm scripts.

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key

# Mapbox Configuration
REACT_APP_MAPBOX_ACCESS_TOKEN_PUBLIC=your-mapbox-public-token
```

### Getting the Keys

1. **Supabase**: Create a project at [supabase.com](https://supabase.com), then go to Settings > API to get your URL and anon key.
2. **Mapbox**: Create an account at [mapbox.com](https://mapbox.com), then go to your Account page to create a public access token.

---

## Local Development

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

> **Important**: The `--legacy-peer-deps` flag is required due to peer dependency conflicts with legacy packages. This is normal for this project.

### 2. Start Development Server

```bash
npm start
```

This will start the development server at `http://localhost:3000`.

The development server includes:
- Hot reloading
- ESLint warnings (non-blocking)
- Source maps for debugging

---

## Production Build

### 1. Create Production Build

```bash
npm run build
```

This command will:
1. Compile and optimize all JavaScript and CSS
2. Generate static files in the `build/` folder
3. Add license headers via gulp

### 2. Preview Production Build Locally

```bash
npx serve -s build
```

This will serve the production build at `http://localhost:3000` for testing.

### Build Output

After running `npm run build`, the `build/` folder will contain:
- `index.html` - Main HTML file
- `static/js/` - Compiled JavaScript chunks
- `static/css/` - Compiled CSS files
- `static/media/` - Images and fonts

---

## Deployment Platforms

### Vercel

#### Option 1: Connect Git Repository (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install --legacy-peer-deps`
5. Add environment variables in the "Environment Variables" section
6. Click "Deploy"

#### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# For production deployment
vercel --prod
```

#### Vercel Configuration (vercel.json)

Create a `vercel.json` file for custom configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "create-react-app",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

### Netlify

#### Option 1: Connect Git Repository (Recommended)

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" > "Import an existing project"
3. Connect your Git repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
5. Click "Show advanced" and add:
   - **NPM_FLAGS**: `--legacy-peer-deps`
6. Add environment variables in "Site settings" > "Environment variables"
7. Click "Deploy site"

#### Option 2: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy (draft)
netlify deploy

# Deploy to production
netlify deploy --prod
```

#### Netlify Configuration (netlify.toml)

Create a `netlify.toml` file in the project root:

```toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NPM_FLAGS = "--legacy-peer-deps"
  NODE_OPTIONS = "--openssl-legacy-provider"

# Handle client-side routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Railway

#### Option 1: Connect Git Repository (Recommended)

#### Option 1: Using .npmrc (Recommended)

1. Ensure there is a `.npmrc` file in the project root with the following content:
   ```text
   legacy-peer-deps=true
   ```
2. Connect your Git repository to Railway.
3. Railway will auto-detect the project and use this flag during the `install` phase.
4. Add environment variables in the **Variables** tab:
   - **CI**: `false` (required to prevent warnings from failing the build)
5. Configure build settings:
   - **Build Command**: `npm run build`
   - **Start Command**: `npx serve -s build -l $PORT`

#### Option 2: Environment Variable Configuration

If you don't want to use a `.npmrc` file, add this environment variable in Railway:
- **Key**: `NPM_CONFIG_LEGACY_PEER_DEPS`
- **Value**: `true`

#### Railway Configuration (railway.json)

Create a `railway.json` file:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install --legacy-peer-deps && npm run build"
  },
  "deploy": {
    "startCommand": "npx serve -s build -l $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Install dependencies | `npm install --legacy-peer-deps` |
| Start development | `npm start` |
| Build for production | `npm run build` |
| Preview production build | `npx serve -s build` |
| Run linter | `npm run lint:check` |
| Fix lint issues | `npm run lint:fix` |
| Format code | `npm run format` |

---

## Troubleshooting

### "digital envelope routines::unsupported" Error

This occurs with Node.js 17+ due to OpenSSL changes. The project already handles this with `NODE_OPTIONS=--openssl-legacy-provider` in the npm scripts, but if you encounter issues:

```bash
# Set manually before running commands
export NODE_OPTIONS=--openssl-legacy-provider
npm run build
```

### Peer Dependency Warnings

These are expected due to the legacy Material-UI v4 and React 17 combination. The `--legacy-peer-deps` flag resolves this.

### Build Fails with ESLint Errors

The project is configured to treat ESLint issues as warnings during development. If build fails:

1. Check the error message for the specific file and line
2. Fix the issue or add `// eslint-disable-next-line` above the problematic line
3. Run `npm run lint:fix` to auto-fix formatting issues

---

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_SUPABASE_URL` | Yes | Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `REACT_APP_MAPBOX_ACCESS_TOKEN_PUBLIC` | Yes | Mapbox public access token |
