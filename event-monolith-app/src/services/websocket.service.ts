import type { WebSocketHandler } from 'elysia'

export class WebSocketService {
  private connections: Set<WebSocketHandler> = new Set()

  addConnection(ws: WebSocketHandler) {
    this.connections.add(ws)
    console.log('WebSocket connection added. Total:', this.connections.size)
  }

  removeConnection(ws: WebSocketHandler) {
    this.connections.delete(ws)
    console.log('WebSocket connection removed. Total:', this.connections.size)
  }

  broadcast(event: string, data: any) {
    const message = JSON.stringify({ event, data })
    let sentCount = 0
    
    this.connections.forEach((ws) => {
      try {
        if (ws.readyState === 1) {
          ws.send(message)
          sentCount++
        }
      } catch (error) {
        console.error('WebSocket send error:', error)
        this.removeConnection(ws)
      }
    })
    
    console.log(`Broadcasted ${event} to ${sentCount} clients`)
  }

  broadcastEventUpdate(event: any) {
    this.broadcast('event_updated', event)
  }

  broadcastEventCreated(event: any) {
    this.broadcast('event_created', event)
  }

  broadcastEventDeleted(eventId: string) {
    this.broadcast('event_deleted', { eventId })
  }

  broadcastRSVPUpdate(rsvp: any) {
    this.broadcast('rsvp_updated', rsvp)
  }
}