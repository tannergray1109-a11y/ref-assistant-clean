# Ref Assistant

A comprehensive referee tracking application for managing games, expenses, mileage, and schedules with calendar integration.

## Features

### 🎯 Core Functionality
- **Game Management**: Track scheduled games with detailed information
- **Calendar Integration**: Visual calendar view with month/week/day views
- **Expense Tracking**: Monitor referee-related expenses with receipt management
- **Mileage Logging**: Track travel distances for tax purposes
- **Reports & Analytics**: Generate financial summaries and reports

### 📅 Calendar Features
- **Multiple Views**: Month, week, and day calendar views
- **Game Scheduling**: Easy game creation and editing directly from calendar
- **Visual Status**: Color-coded game status (scheduled, confirmed, completed, cancelled)
- **Quick Navigation**: Jump to today, navigate between periods
- **Game Details**: Detailed sidebar view for game information
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🔐 Authentication & Data
- **Firebase Authentication**: Secure user login and registration
- **Cloud Sync**: Automatic data synchronization across devices
- **Offline Support**: Works offline with local storage fallback
- **PWA Ready**: Install as a Progressive Web App

## Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- Internet connection for Firebase services
- Firebase project with Authentication and Firestore enabled

### Installation
1. Clone or download this repository
2. Configure Firebase credentials in the HTML files
3. Deploy to a web server or hosting service (Netlify, Vercel, etc.)
4. Access via web browser

### Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication with Email/Password provider
3. Enable Firestore Database
4. Update the Firebase configuration in the HTML files

## File Structure

```
/
├── index.html              # Main dashboard
├── calendar.html           # Calendar view
├── signin.html             # Authentication page
├── manifest.json           # PWA manifest
├── favicon.svg             # App icon
├── README.md               # This file
├── js/
│   ├── auth.js             # Authentication service
│   ├── auth-page.js        # Sign-in page functionality
│   ├── calendar.js         # Calendar management
│   └── store.js            # Data storage and management
└── styles/
    ├── main.css            # Main application styles
    ├── auth.css            # Authentication page styles
    └── calendar.css        # Calendar-specific styles
```

## Usage

### Navigation
- **Dashboard**: Main view with games, expenses, and mileage
- **Calendar**: Visual calendar interface for game management
- Use the sidebar navigation to switch between sections

### Calendar Operations
1. **Adding Games**: Click "Add Game" button or select a date and add game
2. **Viewing Games**: Click on game events to see details in sidebar
3. **Editing Games**: Open game details and click "Edit Game"
4. **Deleting Games**: Use the delete button in the edit game modal
5. **Changing Views**: Toggle between month, week, and day views
6. **Navigation**: Use arrow buttons or "Today" to navigate dates

### Game Information
- Date and time
- Team matchups (home vs away)
- Venue location
- Game level (youth, high school, college, professional, recreational)
- Referee position
- Payment amount
- Status tracking
- Notes and additional details

### Data Synchronization
- Data is automatically saved to local storage
- With Firebase authentication, data syncs to the cloud
- Access your data from any device with the same account

## Browser Support
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

### Local Development
1. Serve files from a local web server (not file:// protocol)
2. Update Firebase configuration with your project credentials
3. Test authentication and data persistence

### Deployment
1. Build and deploy to any static hosting service
2. Configure custom domain if desired
3. Ensure HTTPS for Firebase authentication
4. Test PWA installation

## Security Notes
- Firebase credentials are exposed in client-side code (normal for web apps)
- Configure Firebase Security Rules to protect user data
- Use Firebase Authentication for user isolation
- Regularly update dependencies

## Contributing
This is a personal referee tracking application. Feel free to fork and customize for your needs.

## License
This project is for personal use. Modify and distribute as needed.

## Support
For issues or questions, please refer to the Firebase documentation or create an issue in the repository.

- Vanilla JavaScript
- CSS Grid & Flexbox
- Local Storage for data persistence
- Progressive Web App (PWA) capabilities

## Deployment

This app can be deployed to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- Any web server

## Future Enhancements

- Google Calendar integration
- Firebase authentication and cloud sync
- Advanced reporting features
- Dark mode support
