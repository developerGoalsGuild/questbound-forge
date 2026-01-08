# GoalsGuild QuestBound Forge

A full-stack goal management application with React frontend, Python FastAPI backend, AWS infrastructure, and comprehensive accessibility features.

## 📁 Project Structure

```
questbound-forge/
├── apps/                    # All applications
│   ├── frontend/            # React frontend application
│   └── landing-page/        # Landing page application
├── backend/                 # Backend services and infrastructure
│   ├── services/            # Microservices
│   │   ├── common/          # Shared backend code
│   │   └── [service-name]/  # Individual services
│   └── infra/               # Infrastructure as Code (Terraform)
├── docs/                    # Project documentation
│   ├── architecture/        # Architecture documentation
│   ├── deployment/          # Deployment guides
│   ├── features/            # Feature documentation
│   ├── api/                 # API documentation
│   ├── testing/             # Testing documentation
│   ├── guides/              # Developer and user guides
│   └── project-management/ # Project planning and tracking
├── scripts/                 # Automation scripts
│   ├── deployment/          # Deployment scripts
│   ├── testing/             # Test execution scripts
│   ├── development/         # Development utilities
│   └── infrastructure/      # Infrastructure management
├── tests/                   # Test files
│   ├── integration/        # Integration tests
│   ├── e2e/                # End-to-end tests
│   ├── fixtures/           # Test data and artifacts
│   └── utils/              # Test utilities
├── tools/                   # Development tools
│   ├── debug/              # Debug scripts and utilities
│   └── migration/          # Migration scripts
└── config/                  # Configuration files
    ├── environments/       # Environment-specific configs
    └── shared/            # Shared configurations
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.12+
- AWS CLI configured
- Terraform (for infrastructure)

### Frontend Development
```bash
cd apps/frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend/services/[service-name]
pip install -r requirements.txt
# Run service (varies by service)
```

### Running Tests
```bash
# Frontend tests
cd apps/frontend && npm test

# Backend tests
cd backend/services/[service-name] && pytest

# Integration tests
npm run test:selenium

# E2E tests
.\scripts\testing\run-quest-analytics-selenium-tests.ps1
```

## 📚 Documentation

- [Documentation Index](./docs/README.md) - Complete documentation guide
- [Architecture Guide](./docs/architecture/ArchitectureGuide.md) - System architecture
- [Deployment Guide](./docs/deployment/DEPLOYMENT_CHECKLIST.md) - Deployment instructions
- [API Documentation](./docs/api/postman/README_Postman_Collection.md) - API reference
- [Testing Guide](./tests/README.md) - Testing documentation
- [Scripts Guide](./scripts/README.md) - Scripts usage

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn UI with Tailwind CSS
- **State Management**: React Query, React Context
- **Routing**: React Router
- **Testing**: Vitest, Testing Library

### Backend
- **Framework**: FastAPI (Python)
- **Services**: Microservices architecture
- **Database**: DynamoDB
- **Authentication**: AWS Cognito
- **API Gateway**: AWS API Gateway
- **Infrastructure**: Terraform

### Key Features
- Goal and quest management
- Guild system with collaboration
- Gamification (XP, badges, levels)
- Real-time messaging
- Subscription management
- Comprehensive accessibility support
- Internationalization (i18n)

## 🧪 Testing

The project includes comprehensive testing:
- Unit tests (frontend and backend)
- Integration tests
- End-to-end tests (Selenium)
- Accessibility testing
- Performance testing

See [Testing Guide](./tests/README.md) for details.

## 📝 Scripts

Automation scripts are organized by purpose:
- **Deployment**: Infrastructure and service deployment
- **Testing**: Test execution and automation
- **Development**: Development utilities
- **Infrastructure**: Infrastructure management

See [Scripts Guide](./scripts/README.md) for usage.

## 🔧 Development

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Pre-commit hooks for quality checks

### Accessibility
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- ARIA attributes
- Focus management

### Performance
- Code splitting
- Lazy loading
- Image optimization
- Caching strategies
- Performance monitoring

## 📦 Services

### Backend Services
- **user-service**: User management and profiles
- **quest-service**: Quest and task management
- **guild-service**: Guild management
- **messaging-service**: Real-time messaging
- **gamification-service**: XP, badges, and levels
- **collaboration-service**: Collaboration features
- **subscription-service**: Subscription management
- **connect-service**: AI/ML integration

## 🚢 Deployment

Deployment is handled through Terraform and deployment scripts:
- Infrastructure as Code (Terraform)
- Automated deployment scripts
- Environment-specific configurations
- CI/CD integration ready

See [Deployment Guide](./docs/deployment/DEPLOYMENT_CHECKLIST.md) for details.

## 🤝 Contributing

1. Follow the coding standards and conventions
2. Write tests for new features
3. Update documentation as needed
4. Follow the commit message conventions
5. Ensure accessibility compliance

## 📄 License

[Add your license information here]

## 🔗 Links

- [Documentation](./docs/README.md)
- [API Documentation](./docs/api/postman/README_Postman_Collection.md)
- [Testing Guide](./tests/README.md)
- [Scripts Guide](./scripts/README.md)

## 📞 Support

[Add support contact information here]

