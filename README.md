# Educational Website for Children

An interactive educational website targeting children aged 3-8 years old, featuring learning modules for English, math, and science, along with interactive games and stories.

## Features

- Interactive learning modules for basic English, math, and science
- Story reading sections with audio narration
- Educational games and activities
- Parent management interface
- Child-friendly design with animations and sound effects
- Responsive design for both desktop and mobile
- Accessibility features and high contrast mode
- Dark mode support

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Modern web browser with JavaScript enabled

## Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd educational-website
   ```

2. Run the setup script:
   ```bash
   node scripts/setup.js
   ```

   This will:
   - Check system requirements
   - Install dependencies
   - Create necessary directories
   - Set up environment variables
   - Run the initial build

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values according to your environment

## Development

Start the development server:
```bash
npm start
```

This will:
- Start the webpack dev server
- Enable hot module replacement
- Open the website in your default browser

## Building for Production

Build the project for production:
```bash
npm run build
```

This will:
- Optimize and minify all assets
- Generate production bundles
- Create a `dist` directory with deployable files

## Deployment

Deploy to production server:
```bash
npm run deploy
```

This will:
- Build the project
- Create a backup of the current deployment
- Deploy to the specified directory
- Set proper permissions

### Deployment Configuration

Update the following in your `.env` file:
```
NODE_ENV=production
DEPLOYMENT_DIR=/path/to/deployment
```

## Project Structure

```
├── css/                  # Stylesheets
│   └── components/       # Component-specific styles
├── js/                   # JavaScript files
│   ├── components/       # UI components
│   └── utils/           # Utility functions
├── assets/              # Static assets
│   ├── images/          # Images and icons
│   ├── audio/           # Audio files
│   └── fonts/          # Custom fonts
├── scripts/             # Build and deployment scripts
└── dist/                # Production build output
```

## Testing

Run tests:
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Icons provided by [Font Awesome](https://fontawesome.com/)
- Audio effects from [OpenGameArt](https://opengameart.org/)
- Educational content reviewed by child education experts 