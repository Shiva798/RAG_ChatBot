# RAG ChatBot Frontend - Setup Guide

An Angular 19 frontend application with Server-Side Rendering (SSR) that provides a modern, responsive interface for the RAG ChatBot system.

## 🚀 Features

- **Angular 19** with Server-Side Rendering (SSR)
- **Modern UI Components** with Syncfusion grids
- **Real-time Chat Interface** with message history
- **File Upload Interface** for document management
- **User Authentication** with login/registration
- **PDF Export** functionality for chat conversations
- **Notification System** for user feedback
- **Responsive Design** with SCSS styling

## 📋 Prerequisites

- **Node.js 18 or higher**
- **npm** (comes with Node.js)
- **Angular CLI** (will be installed globally)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd RAG_ChatBot/chatbot_frontend
```

### 2. Install Node.js Dependencies
```bash
# Install Angular CLI globally (if not already installed)
npm install -g @angular/cli

# Install project dependencies
npm install
```

### 3. Backend Configuration

Ensure the backend is running on `http://localhost:8000` (default configuration), or update the endpoint configuration:

**File**: `src/app/services/ragchatbot.endpoints.config.ts`
```typescript
public configbaseUrl: string = 'http://127.0.0.1:8000';
```

Update this URL if your backend is running on a different host/port.

## 🚀 Running the Application

### Development Mode
```bash
# Start the development server
npm start

# Alternative command
ng serve
```

The application will be available at:
- **Frontend**: http://localhost:4200
- **Auto-reload**: Enabled (changes will reload automatically)

### Development with Custom Port
```bash
ng serve --port 4201
```

### Production Build
```bash
# Build for production
npm run build

# Build with SSR
ng build --configuration production
```

### Server-Side Rendering (SSR)
```bash
# Build for SSR
npm run build

# Serve SSR application
npm run serve:ssr:RAG_ChatBot_UI
```

## 📁 Project Structure

```
chatbot_frontend/
├── angular.json          # Angular configuration
├── package.json          # Node.js dependencies
├── tsconfig.json         # TypeScript configuration
├── public/               # Static assets
│   └── favicon.ico
└── src/
    ├── index.html        # Main HTML file
    ├── main.ts           # Application bootstrap
    ├── main.server.ts    # SSR bootstrap
    ├── server.ts         # Express server for SSR
    ├── styles.scss       # Global styles
    └── app/
        ├── app.component.*       # Root component
        ├── app.module.ts         # Main module
        ├── app-routing.module.ts # Route configuration
        ├── components/           # UI Components
        │   ├── chat-message/         # Chat message display
        │   ├── login/                # Authentication
        │   ├── notification/         # Toast notifications
        │   ├── upload-file/          # File upload interface
        │   └── wiki-chat/            # Main chat interface
        ├── services/             # Angular Services
        │   ├── notification.service.ts           # Notification handling
        │   ├── ragchatbot.endpoints.config.ts    # API endpoints
        │   ├── ragchatbot.model.ts               # Data models
        │   └── ragchatbot.service.ts             # API communication
        └── assets/               # Images and static files
            ├── Left-Robot.png
            └── Right-Robot.png
```

## 🔧 Configuration

### Backend API Endpoints
Update the API base URL in `src/app/services/ragchatbot.endpoints.config.ts`:
```typescript
export class RagChatbotEndpointsConfig {
    public configbaseUrl: string = 'http://127.0.0.1:8000';
    // Update this URL to match your backend server
}
```

### Environment-Specific Configuration
For different environments, you can create environment files:

**File**: `src/environments/environment.ts`
```typescript
export const environment = {
    production: false,
    apiUrl: 'http://localhost:8000'
};
```

**File**: `src/environments/environment.prod.ts`
```typescript
export const environment = {
    production: true,
    apiUrl: 'https://your-production-api.com'
};
```

## 📦 Dependencies Overview

### Core Dependencies
- **@angular/core**: Angular framework
- **@angular/router**: Routing functionality
- **@angular/forms**: Form handling
- **@angular/common**: Common utilities
- **@syncfusion/ej2-angular-grids**: Advanced grid components
- **angular2-toaster**: Notification system
- **jspdf**: PDF generation
- **rxjs**: Reactive programming

### Development Dependencies
- **@angular/cli**: Angular command line tools
- **@angular/compiler-cli**: Angular compiler
- **typescript**: TypeScript compiler
- **karma**: Test runner
- **jasmine**: Testing framework

## 🔍 Troubleshooting

### Common Issues

1. **Node.js Version Compatibility**
   ```bash
   # Check Node.js version
   node --version
   # Should be 18.x or higher
   
   # If version is too old, update Node.js
   # Download from: https://nodejs.org/
   ```

2. **Port Already in Use**
   ```bash
   # Use a different port
   ng serve --port 4201
   ```

3. **Backend Connection Issues**
   - Verify backend is running at `http://localhost:8000`
   - Check CORS configuration in backend
   - Update `configbaseUrl` in endpoint configuration

4. **NPM Installation Issues**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Delete node_modules and reinstall
   rmdir /s node_modules
   del package-lock.json
   npm install
   ```

5. **Angular CLI Issues**
   ```bash
   # Reinstall Angular CLI
   npm uninstall -g @angular/cli
   npm install -g @angular/cli@latest
   ```

### Build Issues

1. **Memory Issues During Build**
   ```bash
   # Increase Node.js memory limit
   set NODE_OPTIONS=--max_old_space_size=8192
   npm run build
   ```

2. **TypeScript Compilation Errors**
   - Check `tsconfig.json` configuration
   - Ensure all dependencies are properly installed
   - Update TypeScript version if needed

## 🌐 Browser Support

- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

## 🔒 Security Notes

- Ensure HTTPS in production
- Validate all user inputs
- Implement proper authentication token handling
- Configure Content Security Policy (CSP)
- Use environment variables for sensitive configuration

## 📱 Responsive Design

The application is built with responsive design principles:
- **Desktop**: Full feature set
- **Tablet**: Optimized layout
- **Mobile**: Touch-friendly interface

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run unit tests with coverage
ng test --code-coverage

# Run e2e tests (if configured)
ng e2e
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Serve Built Application
```bash
# Install serve globally
npm install -g serve

# Serve the built application
serve -s dist/rag-chat-bot-ui
```

### SSR Deployment
```bash
# Build for SSR
npm run build

# Start SSR server
npm run serve:ssr:RAG_ChatBot_UI
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify backend connectivity
3. Check browser console for error messages
4. Ensure all dependencies are properly installed
