import Elysia, { t } from 'elysia'
import { AuthController } from '../controllers/auth.controller.js'

const authController = new AuthController()

export default new Elysia({ prefix: '/auth' })
  .post('/signup', async (context) => {
    try {
      const result = await authController.signup({
        prisma: context.prisma,
        body: context.body
      })
      return result
    } catch (error: any) {
      context.set.status = 400
      return { success: false, message: error.message }
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 6 }),
      role: t.Optional(t.String())
    }),
    detail: {
      tags: ['Authentication'],
      summary: 'User registration',
      description: 'Create a new user account with email and password'
    }
  })
  .post('/login', async (context) => {
    try {
      const result = await authController.login({
        prisma: context.prisma,
        body: context.body
      })
      return result
    } catch (error: any) {
      context.set.status = 401
      return { success: false, message: error.message }
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String()
    }),
    detail: {
      tags: ['Authentication'],
      summary: 'User login',
      description: 'Authenticate user and return JWT token'
    }
  })