import Elysia from 'elysia'
import { verifyToken } from '../utils/jwt.utils.js'

export const authMiddleware = new Elysia()
  .derive({ as: 'scoped' }, async (context) => {
    const authHeader = context.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null }
    }

    const token = authHeader.substring(7)
    try {
      const decoded = verifyToken(token)
      const user = await context.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true }
      })
      
      return { user }
    } catch (error) {
      console.error('Auth middleware error:', error)
      return { user: null }
    }
  })