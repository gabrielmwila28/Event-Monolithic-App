import Elysia, { t } from 'elysia'
import { EventController } from '../controllers/event.controller.js'

const eventController = new EventController()

export default new Elysia({ prefix: '/events' })
  .get('/', async (context) => {
    try {
      const result = await eventController.getEvents({
        prisma: context.prisma
      })
      return result
    } catch (error: any) {
      context.set.status = 500
      return { success: false, message: error.message }
    }
  }, {
    detail: {
      tags: ['Events'],
      summary: 'Get all approved events',
      description: 'Retrieve a list of all approved events'
    }
  })
  .post('/', async (context) => {
    try {
      if (!context.user) {
        context.set.status = 401
        return { success: false, message: 'Authentication required' }
      }

      const result = await eventController.createEvent({
        prisma: context.prisma,
        user: context.user,
        body: context.body,
        wsService: context.wsService
      })
      return result
    } catch (error: any) {
      context.set.status = 400
      return { success: false, message: error.message }
    }
  }, {
    body: t.Object({
      title: t.String({ minLength: 1 }),
      description: t.String({ minLength: 1 }),
      date: t.String({ format: 'date-time' }),
      location: t.String({ minLength: 1 })
    }),
    detail: {
      tags: ['Events'],
      summary: 'Create a new event',
      description: 'Create a new event (Organizer or Admin role required)'
    }
  })
  .put('/:id', async (context) => {
    try {
      if (!context.user) {
        context.set.status = 401
        return { success: false, message: 'Authentication required' }
      }

      const result = await eventController.updateEvent({
        prisma: context.prisma,
        user: context.user,
        id: context.params.id,
        body: context.body,
        wsService: context.wsService
      })
      return result
    } catch (error: any) {
      context.set.status = 400
      return { success: false, message: error.message }
    }
  }, {
    body: t.Object({
      title: t.Optional(t.String({ minLength: 1 })),
      description: t.Optional(t.String({ minLength: 1 })),
      date: t.Optional(t.String({ format: 'date-time' })),
      location: t.Optional(t.String({ minLength: 1 }))
    }),
    params: t.Object({
      id: t.String()
    }),
    detail: {
      tags: ['Events'],
      summary: 'Update an event',
      description: 'Update an existing event (Organizer or Admin role required)'
    }
  })
  .delete('/:id', async (context) => {
    try {
      if (!context.user) {
        context.set.status = 401
        return { success: false, message: 'Authentication required' }
      }

      const result = await eventController.deleteEvent({
        prisma: context.prisma,
        user: context.user,
        id: context.params.id,
        wsService: context.wsService
      })
      return result
    } catch (error: any) {
      context.set.status = 400
      return { success: false, message: error.message }
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    detail: {
      tags: ['Events'],
      summary: 'Delete an event',
      description: 'Delete an event (Organizer or Admin role required)'
    }
  })
  .post('/:id/approve', async (context) => {
    try {
      if (!context.user) {
        context.set.status = 401
        return { success: false, message: 'Authentication required' }
      }

      const result = await eventController.approveEvent({
        prisma: context.prisma,
        user: context.user,
        id: context.params.id,
        wsService: context.wsService
      })
      return result
    } catch (error: any) {
      context.set.status = 400
      return { success: false, message: error.message }
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    detail: {
      tags: ['Events'],
      summary: 'Approve an event',
      description: 'Approve an event (Admin role required)'
    }
  })
  .post('/:id/rsvp', async (context) => {
    try {
      if (!context.user) {
        context.set.status = 401
        return { success: false, message: 'Authentication required' }
      }

      const result = await eventController.createRSVP({
        prisma: context.prisma,
        user: context.user,
        eventId: context.params.id,
        status: context.body.status,
        wsService: context.wsService
      })
      return result
    } catch (error: any) {
      context.set.status = 400
      return { success: false, message: error.message }
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      status: t.Union([
        t.Literal('GOING'),
        t.Literal('MAYBE'),
        t.Literal('NOT_GOING')
      ])
    }),
    detail: {
      tags: ['RSVP'],
      summary: 'RSVP to an event',
      description: 'RSVP to an event with status (GOING, MAYBE, NOT_GOING)'
    }
  })