# Voice-Based Email System

A web-based email system designed for accessibility, with a focus on voice commands and screen reader compatibility. This application allows users to manage their emails using voice commands, making it particularly useful for visually challenged users.

## Features

- **Voice Command Recognition**: Control the application using natural voice commands
- **Email Management**: Compose, read, reply to, and delete emails
- **Accessibility Features**: High contrast mode, adjustable font sizes, keyboard navigation
- **Screen Reader Compatibility**: Designed to work seamlessly with screen readers
- **Responsive Design**: Works on desktop and mobile devices
- **Secure Authentication**: User account management with secure login

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Modern web browser with Web Speech API support

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd client
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   SMTP_HOST=your_smtp_host
   SMTP_PORT=your_smtp_port
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   ```
4. Start the development server:
   ```bash
   npm run dev:full
   ```

## Voice Commands

- "Compose new email"
- "Read my emails"
- "Reply to email"
- "Delete email"
- "Search emails"
- "Mark as read"
- "Mark as unread"

## Accessibility Features

- High contrast mode toggle
- Adjustable font size
- Keyboard navigation support
- Screen reader optimized
- ARIA labels and roles
- Focus management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Developers

- Sahil Ansari (sa760887@gmail.com)
- Shweta Gupta (shwetaguptas2710@gmail.com)

## License

This project is licensed under the MIT License - see the LICENSE file for details. 