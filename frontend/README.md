# Attendify - Smart Attendance System

A modern, secure attendance management system with QR code generation, Google OAuth authentication, and blink detection for selfie capture.

## Features

### 🎯 Core Functionality
- **QR Code Generation**: Create unique attendance sessions with scannable QR codes
- **Google OAuth Integration**: Secure authentication using CHARUSAT email validation
- **Blink Detection**: Advanced selfie capture requiring natural blinking for verification
- **Real-time Attendance**: Live tracking of student attendance
- **Session Management**: Comprehensive attendance session creation and management

### 🔐 Security Features
- **Email Domain Validation**: Only @charusat.edu.in emails allowed
- **Blink Verification**: Prevents photo spoofing and ensures live presence
- **Secure Authentication**: Google OAuth 2.0 with proper token handling
- **Session Validation**: Unique session IDs for each attendance session

### 📱 User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Beautiful, intuitive interface built with Tailwind CSS
- **Real-time Feedback**: Instant notifications and status updates
- **Accessibility**: Screen reader friendly with proper ARIA labels

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Authentication**: Google OAuth 2.0
- **QR Code**: react-qr-code library
- **Camera Access**: WebRTC MediaDevices API
- **State Management**: React Hooks + Local Storage

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Platform account (for OAuth)
- Modern web browser with camera access

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd attendify-charusat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google OAuth credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API and Google OAuth2 API
   - Go to Credentials > Create Credentials > OAuth 2.0 Client IDs
   - Set application type to "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:5173/student-auth` (development)
     - `https://yourdomain.com/student-auth` (production)
   - Copy the Client ID and Client Secret

4. **Configure Google OAuth**
   - Open `src/config/google.ts`
   - Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID
   - Replace `YOUR_GOOGLE_CLIENT_SECRET` with your actual Client Secret
   - Update redirect URIs if needed

5. **Start development server**
   ```bash
npm run dev
```

## Usage

### For Administrators

1. **Access Admin Dashboard**
   - Navigate to `/admin-dashboard`
   - Login with admin credentials

2. **Create Attendance Session**
   - Fill in session details (subject, department, semester, etc.)
   - Click "Create Attendance Session"
   - QR code and attendance link will be generated
   - Share QR code or link with students

3. **Manage Teachers**
   - Add new teachers to the system
   - Remove existing teachers
   - View teacher count and statistics

### For Students

1. **Access Attendance System**
   - Scan QR code or click attendance link
   - Authenticate with Google account (@charusat.edu.in only)
   - Grant camera permissions

2. **Mark Attendance**
   - Look at camera and blink naturally
   - System will automatically capture photo when blink detected
   - Review captured photo
   - Submit attendance

### For Teachers

1. **Access Teacher Dashboard**
   - Login with teacher credentials
   - View attendance statistics
   - Access attendance reports

## File Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
│   ├── AdminDashboard.tsx      # Admin dashboard with QR generation
│   ├── StudentAuth.tsx         # Google OAuth authentication
│   ├── StudentAttendance.tsx   # Selfie capture with blink detection
│   └── ...
├── config/             # Configuration files
│   └── google.ts       # Google OAuth settings
├── hooks/              # Custom React hooks
└── lib/                # Utility functions
```

## Configuration

### Google OAuth Settings

Update `src/config/google.ts` with your credentials:

```typescript
export const GOOGLE_CONFIG = {
  CLIENT_ID: "your-actual-client-id.apps.googleusercontent.com",
  CLIENT_SECRET: "your-actual-client-secret",
  REDIRECT_URI: "http://localhost:5173/student-auth",
  // ... other settings
};
```

### Environment Variables

Create `.env.local` file for environment-specific settings:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_API_BASE_URL=your-api-base-url
```

## API Endpoints

The system currently uses localStorage for demo purposes. In production, you'll need to implement these backend endpoints:

- `POST /api/sessions` - Create attendance session
- `POST /api/attendance` - Mark student attendance
- `GET /api/sessions/:id` - Get session details
- `GET /api/attendance/:sessionId` - Get attendance records

## Security Considerations

1. **Email Validation**: Only CHARUSAT domain emails are accepted
2. **Blink Detection**: Prevents photo spoofing attacks
3. **Session Management**: Unique session IDs prevent session hijacking
4. **OAuth Security**: Proper token handling and validation
5. **HTTPS Required**: Production deployment must use HTTPS

## Troubleshooting

### Common Issues

1. **Camera Access Denied**
   - Ensure browser has camera permissions
   - Check if camera is being used by another application

2. **Google OAuth Errors**
   - Verify OAuth credentials are correct
   - Check redirect URIs match exactly
   - Ensure Google APIs are enabled

3. **QR Code Not Scanning**
   - Verify QR code contains valid URL
   - Check if URL is accessible from mobile device
   - Ensure proper lighting for QR code scanning

4. **Blink Detection Not Working**
   - Ensure good lighting conditions
   - Look directly at camera
   - Blink naturally (not too fast or slow)

### Debug Mode

Enable debug logging by setting:

```typescript
const DEBUG_MODE = true;
```

## Deployment

### Production Build

```bash
npm run build
```

### Deployment Options

1. **Vercel**: Connect GitHub repository for automatic deployment
2. **Netlify**: Drag and drop build folder
3. **AWS S3**: Upload build files to S3 bucket
4. **Traditional Hosting**: Upload files to web server

### Environment Setup

1. Update Google OAuth redirect URIs for production domain
2. Set environment variables
3. Configure HTTPS certificates
4. Set up monitoring and logging

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section above

## Roadmap

- [ ] Face recognition integration
- [ ] Attendance analytics dashboard
- [ ] Mobile app development
- [ ] Integration with existing student management systems
- [ ] Advanced reporting features
- [ ] Multi-language support

---

**Note**: This is a demo implementation. For production use, implement proper backend services, database storage, and security measures.
