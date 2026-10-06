require('dotenv').config()

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}))
app.use(express.json())

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/WorkerHub'

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err.message))

// ============ EMAIL CONFIGURATION ============

// Email transporter configuration
// For production, use environment variables for credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
})

// Email templates
const emailTemplates = {
  // User signup confirmation
  userSignup: (name, email) => ({
    subject: '🎉 Welcome to WorkerHub!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3498db, #2ecc71); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">👷 WorkerHub</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Welcome, ${name}! 🎉</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for joining WorkerHub! Your account has been created successfully.
          </p>
          <p style="color: #666; line-height: 1.6;">
            You can now browse and book skilled workers for all your needs.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/workers" 
               style="background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Browse Workers
            </a>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center;">
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      </div>
    `
  }),

  // Worker registration confirmation
  workerSignup: (name, category, phone) => ({
    subject: '🔧 Welcome to WorkerHub - Registration Successful!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #e94560, #ff6b6b); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🔧 WorkerHub</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Welcome, ${name}! 🎉</h2>
          <p style="color: #666; line-height: 1.6;">
            Congratulations! You have been registered as a <strong>${category}</strong> on WorkerHub.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your Profile Details:</h3>
            <p style="color: #666; margin: 5px 0;">📱 Phone: ${phone}</p>
            <p style="color: #666; margin: 5px 0;">💼 Category: ${category}</p>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Customers can now find and book you. Make sure to keep your availability status updated!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/worker-login" 
               style="background: #e94560; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    `
  }),

  // Booking confirmation for user
  bookingConfirmationUser: (userName, workerName, workerCategory, bookingDate, bookingTime, address) => ({
    subject: '✅ Booking Confirmed - WorkerHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #00e676, #00c853); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">✅ Booking Confirmed!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hi ${userName},</h2>
          <p style="color: #666; line-height: 1.6;">
            Your booking has been successfully created!
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00e676;">
            <h3 style="color: #333; margin-top: 0;">Booking Details:</h3>
            <p style="color: #666; margin: 8px 0;">👷 Worker: <strong>${workerName}</strong></p>
            <p style="color: #666; margin: 8px 0;">💼 Category: ${workerCategory}</p>
            <p style="color: #666; margin: 8px 0;">📅 Date: ${bookingDate}</p>
            <p style="color: #666; margin: 8px 0;">🕐 Time: ${bookingTime}</p>
            <p style="color: #666; margin: 8px 0;">📍 Address: ${address}</p>
          </div>
          <p style="color: #666; line-height: 1.6;">
            The worker will contact you soon to confirm the details.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings" 
               style="background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View My Bookings
            </a>
          </div>
        </div>
      </div>
    `
  }),

  // New booking notification for worker
  newBookingWorker: (workerName, customerName, customerPhone, bookingDate, bookingTime, address) => ({
    subject: '🔔 New Booking Request - WorkerHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f39c12, #e74c3c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🔔 New Booking!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hi ${workerName},</h2>
          <p style="color: #666; line-height: 1.6;">
            Great news! You have received a new booking request.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f39c12;">
            <h3 style="color: #333; margin-top: 0;">Customer Details:</h3>
            <p style="color: #666; margin: 8px 0;">👤 Name: <strong>${customerName}</strong></p>
            <p style="color: #666; margin: 8px 0;">📱 Phone: ${customerPhone}</p>
            <p style="color: #666; margin: 8px 0;">📅 Date: ${bookingDate}</p>
            <p style="color: #666; margin: 8px 0;">🕐 Time: ${bookingTime}</p>
            <p style="color: #666; margin: 8px 0;">📍 Address: ${address}</p>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Please login to your dashboard to accept or decline this booking.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/worker-dashboard" 
               style="background: #e94560; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Dashboard
            </a>
          </div>
        </div>
      </div>
    `
  }),

  // Password reset confirmation
  passwordReset: (name) => ({
    subject: '🔐 Password Reset Successful - WorkerHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #9b59b6, #3498db); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🔐 Password Reset</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hi ${name},</h2>
          <p style="color: #666; line-height: 1.6;">
            Your password has been successfully reset.
          </p>
          <p style="color: #666; line-height: 1.6;">
            If you did not make this change, please contact us immediately.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
               style="background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login Now
            </a>
          </div>
        </div>
      </div>
    `
  }),

  // Booking status update
  bookingStatusUpdate: (userName, workerName, status, bookingDate) => ({
    subject: `📋 Booking ${status.charAt(0).toUpperCase() + status.slice(1)} - WorkerHub`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${status === 'confirmed' ? '#00e676, #00c853' : status === 'completed' ? '#3498db, #2980b9' : '#ff6b6b, #ee5a5a'}); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">📋 Booking ${status.charAt(0).toUpperCase() + status.slice(1)}</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hi ${userName},</h2>
          <p style="color: #666; line-height: 1.6;">
            Your booking with <strong>${workerName}</strong> for <strong>${bookingDate}</strong> has been <strong>${status}</strong>.
          </p>
          ${status === 'confirmed' ? '<p style="color: #666; line-height: 1.6;">The worker will arrive at the scheduled time. Please ensure someone is available at the address.</p>' : ''}
          ${status === 'completed' ? '<p style="color: #666; line-height: 1.6;">Thank you for using WorkerHub! We hope you had a great experience.</p>' : ''}
          ${status === 'cancelled' ? '<p style="color: #666; line-height: 1.6;">We\'re sorry this booking was cancelled. You can book another worker anytime.</p>' : ''}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings" 
               style="background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Bookings
            </a>
          </div>
        </div>
      </div>
    `
  })
}

// Send email helper function
const sendEmail = async (to, template) => {
  try {
    // Skip if no email configured
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
      console.log('📧 Email skipped (not configured):', template.subject)
      return { success: true, skipped: true }
    }

    const mailOptions = {
      from: `"WorkerHub" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: template.subject,
      html: template.html
    }

    await transporter.sendMail(mailOptions)
    console.log('📧 Email sent successfully to:', to)
    return { success: true }
  } catch (error) {
    console.error('📧 Email error:', error.message)
    return { success: false, error: error.message }
  }
}

// ============ MONGOOSE SCHEMAS ============

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  photo_url: String,
  location: {
    address: String
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true })

const User = mongoose.model('User', userSchema)

// Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  icon: String,
  description: String
})

const Category = mongoose.model('Category', categorySchema)

// Worker Schema
const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: String,
  password: { type: String, required: true },
  category: { type: String, required: true },
  daily_rate: { type: Number, default: 0 },
  location: String,
  bio: String,
  skills: String,
  photo_url: String,
  availability: { type: String, enum: ['available', 'busy', 'offline'], default: 'available' },
  rating: { type: Number, default: 0 },
  total_reviews: { type: Number, default: 0 },
  total_jobs: { type: Number, default: 0 },
  aadhaar_number: String,
  aadhaar_verified: { type: Boolean, default: false },
  account_status: { type: String, enum: ['pending', 'approved', 'rejected', 'blocked'], default: 'pending' }
}, { timestamps: true })

const Worker = mongoose.model('Worker', workerSchema)

// Booking Schema
const bookingSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer_name: { type: String, required: true },
  customer_phone: { type: String, required: true },
  booking_date: { type: Date, required: true },
  booking_time: String,
  address: String,
  notes: String,
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  payment_status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  payment_method: { type: String, enum: ['upi', 'card', 'net_banking', 'cash', 'none'], default: 'none' },
  service_amount: { type: Number, default: 299 },
  platform_fee: { type: Number, default: 20 },
  total_amount: { type: Number, default: 319 },
  is_reviewed: { type: Boolean, default: false }
}, { timestamps: true })

const Booking = mongoose.model('Booking', bookingSchema)

const complaintSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  issue: { 
    type: String, 
    required: true,
    enum: ['Worker didn\'t arrive', 'Wrong service', 'Payment issue', 'Worker behaviour', 'Other']
  },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' }
}, { timestamps: true })

const Complaint = mongoose.model('Complaint', complaintSchema)

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true })

const Notification = mongoose.model('Notification', notificationSchema)

const reviewSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review_text: { type: String }
}, { timestamps: true })

const Review = mongoose.model('Review', reviewSchema)

// ============ SEED DEFAULT CATEGORIES ============

const seedCategories = async () => {
  const categories = [
    { name: 'Mason', icon: '🧱', description: 'Brick work, plastering, and construction' },
    { name: 'Carpenter', icon: '🪚', description: 'Wood work, furniture, and repairs' },
    { name: 'Electrician', icon: '⚡', description: 'Electrical installations and repairs' },
    { name: 'Plumber', icon: '🔧', description: 'Pipe fitting, drainage, and water systems' },
    { name: 'Painter', icon: '🎨', description: 'Wall painting and finishing' },
    { name: 'Helper', icon: '👷', description: 'General labor and assistance' }
  ]

  try {
    for (const cat of categories) {
      await Category.findOneAndUpdate(
        { name: cat.name },
        cat,
        { upsert: true, new: true }
      )
    }
    console.log('✅ Categories seeded')
  } catch (err) {
    console.error('Error seeding categories:', err)
  }
}

// ============ API ROUTES ============

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword
    })

    await user.save()

    // Send welcome email
    sendEmail(email, emailTemplates.userSignup(name, email))

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, photo_url: user.photo_url, role: user.role }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Google Auth Callback
app.post('/api/auth/google', async (req, res) => {
  try {
    const { name, email, photo_url } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required for Google login' })
    }

    // Check if user exists
    let user = await User.findOne({ email })
    
    if (!user) {
      // Create new user for Google login
      // Generate a random password since they use Google to login
      const randomPassword = Math.random().toString(36).slice(-10)
      const hashedPassword = await bcrypt.hash(randomPassword, 10)

      user = new User({
        name: name || 'Google User',
        email,
        password: hashedPassword,
        photo_url: photo_url || ''
      })
      await user.save()
      
      // Optionally send welcome email
      sendEmail(email, emailTemplates.userSignup(user.name, user.email))
      console.log('✅ New user created via Google Auth:', user.email)
    } else {
      console.log('✅ Existing user logged in via Google Auth:', user.email)
      
      // Update photo if they didn't have one
      if (!user.photo_url && photo_url) {
        user.photo_url = photo_url
        await user.save()
      }
    }

    res.json({
      message: 'Google login successful',
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, photo_url: user.photo_url, role: user.role }
    })
  } catch (error) {
    console.error('Google Auth error:', error)
    res.status(500).json({ error: 'Server error during Google Authentication' })
  }
})

// Setup first admin user
app.post('/api/admin/setup-first-admin', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' })
    if (existingAdmin) {
      return res.status(400).json({ error: 'An admin already exists. Cannot use setup route.' })
    }

    const hashedPassword = await bcrypt.hash('admin123', 10)
    const adminUser = new User({
      name: 'Super Admin',
      email: 'admin@workerhub.com',
      password: hashedPassword,
      phone: '0000000000',
      role: 'admin'
    })
    
    await adminUser.save()
    res.json({ message: 'First admin created! Email: admin@workerhub.com, Password: admin123' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create admin' })
  }
})

// User Forgot Password - Step 1: Verify identity
app.post('/api/auth/forgot-password/verify', async (req, res) => {
  try {
    const { email, phone } = req.body

    console.log('🔑 User password reset request for email:', email)

    if (!email || !phone) {
      return res.status(400).json({ error: 'Email and phone number are required' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ error: 'No user found with this email' })
    }

    // Verify phone number
    if (!user.phone) {
      return res.status(400).json({ error: 'This account does not have a phone number linked. Please contact support.' })
    }

    if (user.phone !== phone) {
      console.log('❌ Phone verification failed for email:', email)
      return res.status(401).json({ error: 'Phone number does not match our records' })
    }

    console.log('✅ Identity verified for password reset:', user.name)
    
    res.json({ 
      message: 'Identity verified',
      user_id: user._id,
      name: user.name
    })
  } catch (error) {
    console.error('User forgot password verify error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// User Forgot Password - Step 2: Reset password
app.post('/api/auth/forgot-password/reset', async (req, res) => {
  try {
    const { user_id, new_password } = req.body

    console.log('🔑 User password reset for ID:', user_id)

    if (!user_id || !new_password) {
      return res.status(400).json({ error: 'User ID and new password are required' })
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const user = await User.findById(user_id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10)
    user.password = hashedPassword
    await user.save()

    // Send password reset confirmation email
    if (user.email) {
      sendEmail(user.email, emailTemplates.passwordReset(user.name))
    }

    console.log('✅ User password reset successful for:', user.name)
    
    res.json({ message: 'Password reset successful. You can now login with your new password.' })
  } catch (error) {
    console.error('User password reset error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Users Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Update User Profile
app.patch('/api/users/:id', async (req, res) => {
  try {
    const { name, phone, location } = req.body

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (name !== undefined) user.name = name
    if (phone !== undefined) user.phone = phone
    if (location !== undefined) user.location = location

    await user.save()

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        photo_url: user.photo_url,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// Categories Routes
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 })
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// Workers Routes
app.get('/api/workers', async (req, res) => {
  try {
    const { category, availability } = req.query
    const filter = {}

    if (category) filter.category = category
    if (availability) filter.availability = availability

    const workers = await Worker.find(filter).sort({ createdAt: -1 })
    res.json(workers)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workers' })
  }
})

app.get('/api/workers/:id', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' })
    }
    res.json(worker)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch worker' })
  }
})

// Update worker status (Admin only)
app.patch('/api/admin/workers/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    
    // Validate status
    if (!['pending', 'approved', 'rejected', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const worker = await Worker.findById(req.params.id)
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' })
    }

    worker.account_status = status
    await worker.save()

    res.json({ message: `Worker status updated to ${status}`, worker })
  } catch (error) {
    console.error('Failed to update worker status:', error)
    res.status(500).json({ error: 'Failed to update worker status' })
  }
})

// Worker Registration (Signup)
app.post('/api/workers', async (req, res) => {
  console.log('📝 Received worker registration:', req.body)

  try {
    const { name, phone, email, password, category, daily_rate, location, bio, skills, aadhaar_number, availability } = req.body

    // Validate required fields
    if (!name || !phone || !category || !password) {
      console.log('❌ Missing required fields')
      return res.status(400).json({ error: 'Name, phone, password, and category are required' })
    }

    // Check if worker already exists with this phone
    const existingWorker = await Worker.findOne({ phone })
    if (existingWorker) {
      return res.status(400).json({ error: 'Phone number already registered. Please login.' })
    }

    // Validate Aadhaar if provided
    if (aadhaar_number && !/^\d{12}$/.test(aadhaar_number)) {
      return res.status(400).json({ error: 'Aadhaar number must be exactly 12 digits' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const worker = new Worker({
      name,
      phone,
      email,
      password: hashedPassword,
      category,
      daily_rate: daily_rate || 0,
      location,
      bio,
      skills,
      aadhaar_number,
      aadhaar_verified: aadhaar_number ? true : false,
      availability: availability || 'available'
    })

    await worker.save()
    console.log('✅ Worker registered with ID:', worker._id)

    // Send welcome email if email provided
    if (email) {
      sendEmail(email, emailTemplates.workerSignup(name, category, phone))
    }
    
    // Return worker data (without password)
    res.status(201).json({ 
      message: 'Worker registered successfully', 
      worker: {
        id: worker._id,
        name: worker.name,
        phone: worker.phone,
        email: worker.email,
        category: worker.category,
        daily_rate: worker.daily_rate,
        location: worker.location,
        availability: worker.availability
      }
    })
  } catch (error) {
    console.error('❌ Error registering worker:', error.message)
    res.status(500).json({ error: 'Failed to register worker: ' + error.message })
  }
})

// Worker Login
app.post('/api/workers/login', async (req, res) => {
  try {
    const { phone, password } = req.body

    console.log('🔐 Worker login attempt for phone:', phone)
    console.log('🔐 Password received:', password)

    const worker = await Worker.findOne({ phone })
    if (!worker) {
      console.log('❌ Worker not found with phone:', phone)
      return res.status(401).json({ error: 'Invalid phone number or password' })
    }

    console.log('🔐 Worker found:', worker.name)
    console.log('🔐 Stored password hash exists:', !!worker.password)

    // Check if worker has a password (old workers might not have one)
    if (!worker.password) {
      console.log('❌ Worker has no password (old registration):', phone)
      return res.status(401).json({ error: 'This account was created before passwords were required. Please register again with a new phone number.' })
    }

    const validPassword = await bcrypt.compare(password, worker.password)
    console.log('🔐 Password comparison result:', validPassword)
    
    if (!validPassword) {
      console.log('❌ Invalid password for phone:', phone)
      return res.status(401).json({ error: 'Invalid phone number or password' })
    }

    console.log('✅ Worker login successful:', worker.name)

    res.json({
      message: 'Login successful',
      worker: {
        id: worker._id,
        name: worker.name,
        phone: worker.phone,
        email: worker.email,
        category: worker.category,
        daily_rate: worker.daily_rate,
        location: worker.location,
        bio: worker.bio,
        skills: worker.skills,
        availability: worker.availability,
        rating: worker.rating,
        total_jobs: worker.total_jobs,
        aadhaar_verified: worker.aadhaar_verified,
        photo_url: worker.photo_url
      }
    })
  } catch (error) {
    console.error('Worker login error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Delete old workers without passwords (cleanup)
app.delete('/api/workers/cleanup', async (req, res) => {
  try {
    const result = await Worker.deleteMany({ password: { $exists: false } })
    console.log('🧹 Cleaned up workers without passwords:', result.deletedCount)
    res.json({ message: `Deleted ${result.deletedCount} old workers without passwords` })
  } catch (error) {
    console.error('Cleanup error:', error)
    res.status(500).json({ error: 'Failed to cleanup' })
  }
})

// Worker Forgot Password - Step 1: Verify identity
app.post('/api/workers/forgot-password/verify', async (req, res) => {
  try {
    const { phone, aadhaar_number } = req.body

    console.log('🔑 Password reset request for phone:', phone)

    if (!phone || !aadhaar_number) {
      return res.status(400).json({ error: 'Phone number and Aadhaar number are required' })
    }

    const worker = await Worker.findOne({ phone })
    if (!worker) {
      return res.status(404).json({ error: 'No worker found with this phone number' })
    }

    // Verify Aadhaar number
    if (!worker.aadhaar_number) {
      return res.status(400).json({ error: 'This account does not have Aadhaar linked. Please contact support.' })
    }

    if (worker.aadhaar_number !== aadhaar_number) {
      console.log('❌ Aadhaar verification failed for phone:', phone)
      return res.status(401).json({ error: 'Aadhaar number does not match our records' })
    }

    console.log('✅ Identity verified for password reset:', worker.name)
    
    res.json({ 
      message: 'Identity verified',
      worker_id: worker._id,
      name: worker.name
    })
  } catch (error) {
    console.error('Forgot password verify error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Worker Forgot Password - Step 2: Reset password
app.post('/api/workers/forgot-password/reset', async (req, res) => {
  try {
    const { worker_id, new_password } = req.body

    console.log('🔑 Password reset for worker ID:', worker_id)

    if (!worker_id || !new_password) {
      return res.status(400).json({ error: 'Worker ID and new password are required' })
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const worker = await Worker.findById(worker_id)
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10)
    worker.password = hashedPassword
    await worker.save()

    // Send password reset confirmation email
    if (worker.email) {
      sendEmail(worker.email, emailTemplates.passwordReset(worker.name))
    }

    console.log('✅ Password reset successful for:', worker.name)
    
    res.json({ message: 'Password reset successful. You can now login with your new password.' })
  } catch (error) {
    console.error('Password reset error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Update Worker Profile
app.patch('/api/workers/:id', async (req, res) => {
  try {
    const { availability, daily_rate, location, bio, skills, photo_url } = req.body

    const worker = await Worker.findById(req.params.id)
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' })
    }

    // Update fields if provided
    if (availability !== undefined) worker.availability = availability
    if (daily_rate !== undefined) worker.daily_rate = daily_rate
    if (location !== undefined) worker.location = location
    if (bio !== undefined) worker.bio = bio
    if (skills !== undefined) worker.skills = skills
    if (photo_url !== undefined) worker.photo_url = photo_url

    await worker.save()
    console.log('✅ Worker profile updated:', worker._id)

    res.json({
      message: 'Profile updated successfully',
      worker: {
        id: worker._id,
        name: worker.name,
        phone: worker.phone,
        email: worker.email,
        category: worker.category,
        daily_rate: worker.daily_rate,
        location: worker.location,
        bio: worker.bio,
        skills: worker.skills,
        availability: worker.availability,
        rating: worker.rating,
        total_jobs: worker.total_jobs,
        aadhaar_verified: worker.aadhaar_verified,
        photo_url: worker.photo_url
      }
    })
  } catch (error) {
    console.error('Error updating worker:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// Get Worker's Bookings
app.get('/api/workers/:id/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find({ worker_id: req.params.id })
      .populate('user_id', 'name phone email')
      .sort({ createdAt: -1 })

    res.json(bookings)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' })
  }
})

// Bookings Routes
app.get('/api/bookings', async (req, res) => {
  try {
    const { user_id } = req.query
    const filter = {}

    if (user_id) filter.user_id = user_id

    const bookings = await Booking.find(filter)
      .populate('worker_id', 'name category phone daily_rate')
      .sort({ createdAt: -1 })

    // Format response to match previous API structure
    const formattedBookings = bookings.map(b => ({
      ...b.toObject(),
      worker_name: b.worker_id?.name,
      worker_category: b.worker_id?.category,
      worker_phone: b.worker_id?.phone
    }))

    res.json(formattedBookings)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' })
  }
})

app.post('/api/bookings', async (req, res) => {
  try {
    const { worker_id, user_id, customer_name, customer_phone, booking_date, booking_time, address, notes } = req.body

    // Fetch worker to get their hourly rate
    const worker = await Worker.findById(worker_id)
    if (!worker) return res.status(404).json({ error: 'Worker not found' })

    const service_amount = worker.daily_rate || 299 // Default to 299 if not set
    const platform_fee = 20
    const total_amount = service_amount + platform_fee

    const booking = new Booking({
      worker_id,
      user_id,
      customer_name,
      customer_phone,
      booking_date,
      booking_time,
      address,
      notes,
      service_amount,
      platform_fee,
      total_amount
    })

    await booking.save()

    // Create Notification for Worker
    await new Notification({
      worker_id,
      title: 'New booking request',
      message: `You have a new booking from ${customer_name} on ${booking_date.split('T')[0]}.`
    }).save()

    // Set worker availability to "busy" when booked
    await Worker.findByIdAndUpdate(worker_id, { availability: 'busy' })

    // Send email notifications
    const formattedDate = new Date(booking_date).toLocaleDateString('en-IN', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    })

    // Email to customer if user_id is provided
    if (user_id) {
      const user = await User.findById(user_id)
      if (user && user.email) {
        sendEmail(user.email, emailTemplates.bookingConfirmationUser(
          user.name, 
          worker.name, 
          worker.category, 
          formattedDate, 
          booking_time, 
          address
        ))
      }
    }

    // Email to worker
    if (worker && worker.email) {
      sendEmail(worker.email, emailTemplates.newBookingWorker(
        worker.name,
        customer_name,
        customer_phone,
        formattedDate,
        booking_time,
        address
      ))
    }

    console.log('✅ Booking created, worker set to busy')
    res.status(201).json({ message: 'Booking created successfully', id: booking._id })
  } catch (error) {
    console.error('Error creating booking:', error)
    res.status(500).json({ error: 'Failed to create booking' })
  }
})

app.patch('/api/bookings/:id', async (req, res) => {
  try {
    const { status } = req.body

    const booking = await Booking.findById(req.params.id).populate('worker_id')
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    booking.status = status
    await booking.save()

    // Create Notification for User
    if (booking.user_id) {
      let title = ''
      let message = ''
      if (status === 'confirmed') {
        title = 'Worker accepted your booking'
        message = `${booking.worker_id.name} is on the way!`
      } else if (status === 'completed') {
        title = 'Service completed'
        message = `Your service by ${booking.worker_id.name} has been completed.`
      } else if (status === 'cancelled') {
        title = 'Booking cancelled'
        message = `Your booking for ${booking.worker_id.name} was cancelled.`
      }
      
      if (title) {
        await new Notification({
          user_id: booking.user_id,
          title,
          message
        }).save()
      }
    }

    // If booking is completed or cancelled, set worker back to available
    if (status === 'completed' || status === 'cancelled') {
      await Worker.findByIdAndUpdate(booking.worker_id._id, { availability: 'available' })
      console.log('✅ Worker set back to available')
    }

    // Send status update email to user
    if (booking.user_id) {
      const user = await User.findById(booking.user_id)
      if (user && user.email) {
        const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-IN', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
        sendEmail(user.email, emailTemplates.bookingStatusUpdate(
          user.name,
          booking.worker_id.name,
          status,
          formattedDate
        ))
      }
    }

    res.json({ message: 'Booking updated successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking' })
  }
})

// Worker stats for homepage
app.get('/api/workers/stats/:category', async (req, res) => {
  try {
    const category = req.params.category

    const total = await Worker.countDocuments({ category })
    const available = await Worker.countDocuments({ category, availability: 'available' })
    const busy = await Worker.countDocuments({ category, availability: 'busy' })
    const offline = await Worker.countDocuments({ category, availability: 'offline' })

    res.json({ total, available, busy, offline })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add review' })
  }
})

// Admin Routes
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const totalWorkers = await Worker.countDocuments()
    const totalBookings = await Booking.countDocuments()
    const pendingWorkers = await Worker.countDocuments({ aadhaar_verified: false })
    const activeBookings = await Booking.countDocuments({ status: 'confirmed' })
    
    res.json({
      totalUsers,
      totalWorkers,
      totalBookings,
      revenue: '₹8.5L',
      pendingWorkers,
      activeBookings,
      complaints: 8
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// ============ INITIALIZATION ======================

// Check email configuration status
app.get('/api/email/status', (req, res) => {
  const isConfigured = process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com'
  res.json({
    configured: isConfigured,
    message: isConfigured 
      ? 'Email service is configured and ready' 
      : 'Email service not configured. Set EMAIL_USER and EMAIL_PASS environment variables.'
  })
})

// Send test email
app.post('/api/email/test', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' })
    }

    // Check if email is configured
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
      return res.status(503).json({ 
        error: 'Email service not configured',
        instructions: {
          step1: 'Set EMAIL_USER environment variable to your Gmail address',
          step2: 'Enable 2-Factor Authentication in your Google Account',
          step3: 'Generate an App Password at: https://myaccount.google.com/apppasswords',
          step4: 'Set EMAIL_PASS environment variable to the generated App Password'
        }
      })
    }

    const testTemplate = {
      subject: '✅ WorkerHub Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3498db, #2ecc71); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">✅ Email Test Successful!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #666; line-height: 1.6;">
              This is a test email from WorkerHub. If you received this email, your email configuration is working correctly!
            </p>
            <p style="color: #666; line-height: 1.6;">
              You will now receive email notifications for:
            </p>
            <ul style="color: #666; line-height: 1.8;">
              <li>🎉 Account registration confirmation</li>
              <li>📅 Booking confirmations</li>
              <li>🔔 New booking notifications (for workers)</li>
              <li>📋 Booking status updates</li>
              <li>🔐 Password reset confirmations</li>
            </ul>
          </div>
        </div>
      `
    }

    const result = await sendEmail(email, testTemplate)
    
    if (result.success) {
      res.json({ message: 'Test email sent successfully! Check your inbox.' })
    } else {
      res.status(500).json({ error: 'Failed to send email', details: result.error })
    }
  } catch (error) {
    console.error('Email test error:', error)
    res.status(500).json({ error: 'Server error during email test' })
  }
})

// ============ COMPLAINTS ROUTES ============

// Create a new complaint
app.post('/api/complaints', async (req, res) => {
  try {
    const { booking_id, user_id, worker_id, issue, description } = req.body
    
    const complaint = new Complaint({
      booking_id,
      user_id,
      worker_id,
      issue,
      description
    })
    
    await complaint.save()
    res.status(201).json(complaint)
  } catch (error) {
    console.error('Error creating complaint:', error)
    res.status(500).json({ error: 'Failed to submit complaint' })
  }
})

// Get all complaints (Admin)
app.get('/api/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('user_id', 'name email phone')
      .populate('worker_id', 'name category phone')
      .populate('booking_id')
      .sort({ createdAt: -1 })
      
    res.json(complaints)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch complaints' })
  }
})

// Update complaint status (Admin)
app.put('/api/complaints/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' })
    }
    
    res.json(complaint)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update complaint' })
  }
})

// ============ NOTIFICATION ROUTES ============

// Get notifications for a user or worker
app.get('/api/notifications', async (req, res) => {
  try {
    const { user_id, worker_id } = req.query
    const filter = {}
    
    if (user_id) filter.user_id = user_id
    else if (worker_id) filter.worker_id = worker_id
    else return res.status(400).json({ error: 'Must provide user_id or worker_id' })
    
    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50)
    res.json(notifications)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// Mark notifications as read
app.put('/api/notifications/mark-read', async (req, res) => {
  try {
    const { user_id, worker_id } = req.body
    const filter = {}
    
    if (user_id) filter.user_id = user_id
    else if (worker_id) filter.worker_id = worker_id
    else return res.status(400).json({ error: 'Must provide user_id or worker_id' })
    
    await Notification.updateMany(
      { ...filter, read: false },
      { $set: { read: true } }
    )
    
    res.json({ message: 'Notifications marked as read' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' })
  }
})

// ============ REVIEWS & PAYMENTS ============

// Simulate Payment for Booking
app.post('/api/bookings/:id/pay', async (req, res) => {
  try {
    const { payment_method } = req.body
    
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only pay for completed services' })
    }
    
    booking.payment_status = 'paid'
    booking.payment_method = payment_method || 'cash'
    await booking.save()
    
    res.json({ message: 'Payment successful', booking })
  } catch (error) {
    res.status(500).json({ error: 'Payment processing failed' })
  }
})

// Submit Review
app.post('/api/reviews', async (req, res) => {
  try {
    const { booking_id, worker_id, user_id, rating, review_text } = req.body
    
    const booking = await Booking.findById(booking_id)
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.is_reviewed) return res.status(400).json({ error: 'Review already submitted' })
    
    const review = new Review({ booking_id, worker_id, user_id, rating, review_text })
    await review.save()
    
    booking.is_reviewed = true
    await booking.save()
    
    // Update worker rating dynamically
    const allReviews = await Review.find({ worker_id })
    const total_reviews = allReviews.length
    const average_rating = total_reviews > 0 
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / total_reviews 
      : rating
      
    await Worker.findByIdAndUpdate(worker_id, {
      rating: parseFloat(average_rating.toFixed(1)),
      total_reviews
    })
    
    res.json({ message: 'Review submitted successfully', review })
  } catch (error) {
    console.error('Review Error:', error)
    res.status(500).json({ error: 'Failed to submit review' })
  }
})

// Get Worker Reviews
app.get('/api/workers/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ worker_id: req.params.id })
      .populate('user_id', 'name photo_url')
      .sort({ createdAt: -1 })
    res.json(reviews)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' })
  }
})

// Admin Payments Dashboard Route
app.get('/api/admin/payments', async (req, res) => {
  try {
    const completedBookings = await Booking.find({ status: 'completed' })
      .populate('worker_id', 'name')
      .populate('user_id', 'name')
      .sort({ createdAt: -1 })

    let totalRevenue = 0
    let platformRevenue = 0
    let pendingAmount = 0

    completedBookings.forEach(booking => {
      if (booking.payment_status === 'paid') {
        totalRevenue += booking.total_amount
        platformRevenue += booking.platform_fee
      } else {
        pendingAmount += booking.total_amount
      }
    })

    res.json({
      stats: {
        totalRevenue,
        platformRevenue,
        pendingAmount,
        totalCompletedBookings: completedBookings.length
      },
      bookings: completedBookings
    })
  } catch (error) {
    console.error('Error fetching admin payments:', error)
    res.status(500).json({ error: 'Failed to fetch payment data' })
  }
})

// Start server
const startServer = async () => {
  try {
    // Wait for MongoDB connection
    await mongoose.connection.asPromise()
    
    // Seed categories
    await seedCategories()

    // Log email configuration status
    if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com') {
      console.log('📧 Email notifications: ENABLED')
    } else {
      console.log('📧 Email notifications: DISABLED (configure EMAIL_USER and EMAIL_PASS)')
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`)
      console.log('📡 API Endpoints:')
      console.log('   - GET  /api/categories')
      console.log('   - GET  /api/workers')
      console.log('   - POST /api/workers')
      console.log('   - GET  /api/bookings')
      console.log('   - POST /api/bookings')
      console.log('   - POST /api/auth/signup')
      console.log('   - POST /api/auth/login')
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    console.log('\n💡 Make sure MongoDB is running!')
    console.log('   - Start MongoDB service')
    console.log('   - Or use MongoDB Atlas connection string')
  }
}

startServer()
