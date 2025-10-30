import type { UserRole, RSVPStatus } from '@prisma/client'

export class EventController {
  async getEvents(params: { prisma: any }) {
    const events = await params.prisma.event.findMany({
      where: { approved: true },
      include: {
        organizer: {
          select: { id: true, email: true }
        },
        rsvps: {
          include: {
            user: {
              select: { id: true, email: true }
            }
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    return {
      success: true,
      data: events
    }
  }

  async createEvent(params: { 
    prisma: any, 
    user: any, 
    body: any,
    wsService: any
  }) {
    const { prisma, user, body, wsService } = params

    // Check if user is organizer or admin
    if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
      throw new Error('Insufficient permissions')
    }

    const event = await prisma.event.create({
      data: {
        ...body,
        organizerId: user.id,
        approved: user.role === 'ADMIN' // Auto-approve if admin
      },
      include: {
        organizer: {
          select: { id: true, email: true }
        }
      }
    })

    // Broadcast event creation
    wsService.broadcastEventCreated(event)

    return {
      success: true,
      message: 'Event created successfully',
      data: event
    }
  }

  async updateEvent(params: { 
    prisma: any, 
    user: any, 
    id: string, 
    body: any,
    wsService: any
  }) {
    const { prisma, user, id, body, wsService } = params

    // Check if event exists and user has permission
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    })

    if (!existingEvent) {
      throw new Error('Event not found')
    }

    if (user.role !== 'ADMIN' && existingEvent.organizerId !== user.id) {
      throw new Error('Insufficient permissions')
    }

    const event = await prisma.event.update({
      where: { id },
      data: body,
      include: {
        organizer: {
          select: { id: true, email: true }
        }
      }
    })

    // Broadcast event update
    wsService.broadcastEventUpdate(event)

    return {
      success: true,
      message: 'Event updated successfully',
      data: event
    }
  }

  async deleteEvent(params: { 
    prisma: any, 
    user: any, 
    id: string,
    wsService: any
  }) {
    const { prisma, user, id, wsService } = params

    // Check if event exists and user has permission
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    })

    if (!existingEvent) {
      throw new Error('Event not found')
    }

    if (user.role !== 'ADMIN' && existingEvent.organizerId !== user.id) {
      throw new Error('Insufficient permissions')
    }

    await prisma.event.delete({
      where: { id }
    })

    // Broadcast event deletion
    wsService.broadcastEventDeleted(id)

    return {
      success: true,
      message: 'Event deleted successfully'
    }
  }

  async approveEvent(params: { 
    prisma: any, 
    user: any, 
    id: string,
    wsService: any
  }) {
    const { prisma, user, id, wsService } = params

    // Only admin can approve events
    if (user.role !== 'ADMIN') {
      throw new Error('Admin access required')
    }

    const event = await prisma.event.update({
      where: { id },
      data: { approved: true },
      include: {
        organizer: {
          select: { id: true, email: true }
        }
      }
    })

    // Broadcast event approval
    wsService.broadcastEventUpdate(event)

    return {
      success: true,
      message: 'Event approved successfully',
      data: event
    }
  }

  async createRSVP(params: { 
    prisma: any, 
    user: any, 
    eventId: string, 
    status: RSVPStatus,
    wsService: any
  }) {
    const { prisma, user, eventId, status, wsService } = params

    // Check if event exists and is approved
    const event = await prisma.event.findUnique({
      where: { id: eventId, approved: true }
    })

    if (!event) {
      throw new Error('Event not found or not approved')
    }

    const rsvp = await prisma.rSVP.upsert({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId
        }
      },
      update: { status },
      create: {
        userId: user.id,
        eventId,
        status
      },
      include: {
        user: {
          select: { id: true, email: true }
        },
        event: {
          include: {
            organizer: {
              select: { id: true, email: true }
            }
          }
        }
      }
    })

    // Broadcast RSVP update
    wsService.broadcastRSVPUpdate(rsvp)

    return {
      success: true,
      message: 'RSVP updated successfully',
      data: rsvp
    }
  }
}