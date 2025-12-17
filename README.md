# ADO Wrapped 🎁

**Your Azure DevOps Year in Review** - A personalized summary of your Azure DevOps activity, inspired by Spotify Wrapped.

## Overview

ADO Wrapped analyzes your Azure DevOps activity and generates a personalized, shareable summary of your contributions throughout the year. See your commits, pull requests, work items, and more visualized in a fun and engaging format.

## Features

- 📊 **Activity Analytics** - View your commits, PRs, and work item statistics
- 🏆 **Achievement Badges** - Earn badges based on your contributions
- 📈 **Trend Visualization** - See your activity patterns over time
- 🤝 **Collaboration Insights** - Discover who you collaborated with most
- 📱 **Shareable Cards** - Generate beautiful summary cards to share
- 🔒 **Privacy First** - Your data stays secure and private

## Getting Started

### Prerequisites

- Node.js 18+ or Python 3.10+
- Azure DevOps account with API access
- Personal Access Token (PAT) with appropriate permissions

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/ado-wrapped.git
   cd ado-wrapped
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pip install -r requirements.txt
   ```

3. Configure your environment:
   ```bash
   cp .env.example .env
   # Edit .env with your Azure DevOps credentials
   ```

4. Run the application:
   ```bash
   npm start
   # or
   python main.py
   ```

## Configuration

Create a `.env` file with the following variables:

```env
ADO_ORGANIZATION=your-organization
ADO_PROJECT=your-project
ADO_PAT=your-personal-access-token
```

## API Permissions Required

Your Personal Access Token needs the following scopes:
- **Code**: Read
- **Work Items**: Read
- **Build**: Read
- **Release**: Read
- **Graph**: Read (for user information)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Spotify Wrapped
- Built with ❤️ for the Azure DevOps community
