import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { PrismaClient } from '@prisma/client'
import authRoutes from './routes/auth.routes.js'
import eventRoutes from './routes/event.routes.js'
import { WebSocketService } from './services/websocket.service.js'
import { authMiddleware } from './middleware/auth.middleware.js'

const prisma = new PrismaClient()
const app = new Elysia()

// Initialize WebSocket service
const wsService = new WebSocketService()

// Global context
app.decorate('prisma', prisma)
app.decorate('wsService', wsService)

// Plugins
app.use(cors())
app.use(swagger({
  documentation: {
    info: {
      title: 'Event Management API',
      version: '1.0.0',
      description: 'A collaborative event management system with realtime updates'
    }
  }
}))

// WebSocket endpoint
app.ws('/ws', {
  open(ws) {
    wsService.addConnection(ws)
    console.log('New WebSocket connection established')
  },
  close(ws) {
    wsService.removeConnection(ws)
    console.log('WebSocket connection closed')
  }
})

// Routes
app.use(authRoutes)
app.use(authMiddleware)
app.use(eventRoutes)

// Health check
app.get('/', () => ({ status: 'OK', message: 'Event Management API is running' }))
app.get('/health', () => ({ status: 'OK', timestamp: new Date().toISOString() }))

// Function to find available port
function findAvailablePort(startPort: number = 3000): number {
  for (let port = startPort; port < 4000; port++) {
    try {
      const server = Bun.listen({
        port,
        hostname: 'localhost',
        socket: {
          open() {},
          data() {},
          close() {}
        }
      })
      server.stop()
      return port
    } catch (error) {
      // Port is in use, try next one
      continue
    }
  }
  throw new Error('No available ports found between 3000-4000')
}

// Find and use available port
const availablePort = findAvailablePort(3000)
console.log(`Found available port: ${availablePort}`)

app.listen(availablePort, () => {
  console.log(`🚀 Server running at http://localhost:${availablePort}`)
  console.log(`📚 Swagger docs at http://localhost:${availablePort}/swagger`)
  console.log(`🌐 Health check: http://localhost:${availablePort}/health`)
})

export default app