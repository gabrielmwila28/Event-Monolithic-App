import bcrypt from 'bcryptjs'
import { EmailService } from '../services/email.service.js'
import { generateToken } from '../utils/jwt.utils.js'

const emailService = new EmailService()

export class AuthController {
  async signup(params: { 
    prisma: any, 
    body: { email: string; password: string; role?: string } 
  }) {
    const { prisma, body } = params
    const { email, password, role } = body

    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        throw new Error('User already exists')
      }

      // Hash password - FIXED: Use proper bcrypt hashing
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log('Password hashed. Original:', password, 'Hashed:', hashedPassword);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: role || 'ATTENDEE'
        }
      })
      console.log('User created successfully:', user.email);

      // Send welcome email
      emailService.sendWelcomeEmail(email).catch(error => {
        console.error('Failed to send welcome email:', error)
      })

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      })

      return {
        success: true,
        message: 'User created successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role
          },
          token
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      throw new Error(`Signup failed: ${error.message}`)
    }
  }

  async login(params: { 
    prisma: any, 
    body: { email: string; password: string } 
  }) {
    const { prisma, body } = params
    const { email, password } = body

    try {
      console.log('Login attempt for:', email);
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        console.log('User not found');
        throw new Error('Invalid credentials')
      }

      console.log('User found, comparing passwords...');
      console.log('Input password:', password);
      console.log('Stored hash:', user.password);
      
      // Compare password - FIXED: Use proper bcrypt comparison
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('Password comparison result:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('Password comparison failed');
        throw new Error('Invalid credentials')
      }

      console.log('Login successful!');
      
      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      })

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role
          },
          token
        }
      }
    } catch (error: any) {
      console.error('Login error:', error.message)
      throw new Error('Invalid credentials')
    }
  }
}