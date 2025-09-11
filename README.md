# RaktMap - Blood Donation Management System

A comprehensive blood donation management system that connects donors with hospitals in real-time.

## 🩸 Features

- **SMS-based Donor Alerts**: Send location-specific alerts to donors via SMS
- **Real-time Location Tracking**: Track donor responses and locations on live maps
- **Hospital Dashboard**: Manage blood requests and view available donors
- **Admin Panel**: Complete system administration and analytics
- **Secure Authentication**: JWT-based authentication for hospitals and admins

## 🏗️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB Atlas** for database
- **Mongoose** ODM
- **JWT** for authentication
- **Twilio** for SMS services
- **bcryptjs** for password hashing

### Frontend
- **React** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Leaflet** for interactive maps
- **Axios** for API calls

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Twilio account for SMS services

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/raktmap.git
   cd raktmap
   ```

2. **Install Backend Dependencies**
   ```bash
   cd project/backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   - Copy `project/backend/.env.example` to `project/backend/.env`
   - Fill in your environment variables:
     ```env
     TWILIO_ACCOUNT_SID=your_twilio_account_sid
     TWILIO_AUTH_TOKEN=your_twilio_auth_token
     TWILIO_PHONE_NUMBER=your_twilio_phone_number
     JWT_SECRET=your_secure_jwt_secret
     MONGODB_URI=your_mongodb_atlas_connection_string
     ```

### Running the Application

1. **Start Backend Server**
   ```bash
   cd project/backend
   npm start
   ```

2. **Start Frontend Development Server**
   ```bash
   cd project/frontend
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📱 Usage

### For Hospitals
1. Register/Login as a hospital
2. Create blood requests
3. View live map of available donors
4. Track donation history

### For Donors
1. Receive SMS alerts for nearby blood requests
2. Click link to respond with location
3. Get directions to donation center

### For Admins
1. Manage hospital accounts
2. View system analytics
3. Monitor donation activities

## 🔒 Security Features

- Environment variables for sensitive data
- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization

## 📊 Project Structure

```
RaktMap/
├── project/
│   ├── backend/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Route controllers
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utility functions
│   └── frontend/
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── contexts/    # React contexts
│       │   ├── types/       # TypeScript types
│       │   └── utils/       # Frontend utilities
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email contact.meghansh4455@gmail.com or join our Slack channel.

---

**Made with ❤️ for saving lives through technology**
