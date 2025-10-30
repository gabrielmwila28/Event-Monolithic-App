import nodemailer from 'nodemailer'

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    // Using Ethereal email for testing
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USERNAME || 'test@ethereal.email',
        pass: process.env.ETHEREAL_PASSWORD || 'test-password'
      }
    })
  }

  async sendWelcomeEmail(to: string) {
    const mailOptions = {
      from: '"Event Management" <noreply@eventapp.com>',
      to,
      subject: 'Welcome to Event Management App!',
      html: `
        <h1>Welcome to Event Management App!</h1>
        <p>Your account has been successfully created.</p>
        <p>You can now create events, RSVP to events, and receive realtime updates.</p>
        <br/>
        <p><em>This is a mock email from Ethereal for testing purposes.</em></p>
      `
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log('Welcome email sent:', info.messageId)
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
      return info
    } catch (error) {
      console.error('Error sending email:', error)
      // Don't throw error - email failure shouldn't break the app
      return null
    }
  }
}