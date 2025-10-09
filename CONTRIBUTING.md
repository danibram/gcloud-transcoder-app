# Contributing to Google Cloud Transcoder API Desktop Application

Thank you for your interest in contributing to this project! We welcome contributions from everyone.

## 🚀 Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Git
- Google Cloud account (for testing)

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/transcoder-api-ui.git
   cd transcoder-api-ui
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up authentication** (see README.md for details)
5. **Start development server**:
   ```bash
   npm run dev
   ```

## 🛠️ Development Guidelines

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the existing ESLint configuration
- **Prettier**: Code formatting is handled automatically
- **Naming Conventions**:
  - PascalCase for components and interfaces
  - camelCase for functions and variables
  - kebab-case for file names

### Project Structure

```
src/
├── main/           # Electron main process (Node.js)
├── preload/        # Preload scripts (secure IPC bridge)
└── renderer/       # UI components (SolidJS + TypeScript)
    ├── components/ # Reusable UI components
    ├── stores/     # State management
    └── types.ts    # Type definitions
```

### Commit Messages

Use conventional commit format:
- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `style: formatting changes`
- `refactor: code restructuring`
- `test: add or update tests`
- `chore: maintenance tasks`

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

## 🧪 Testing

### Running Tests

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build
```

### Manual Testing

1. Test the main dashboard functionality
2. Verify settings page works correctly
3. Test authentication methods
4. Check job details modal
5. Verify cross-platform compatibility

## 📝 Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following the guidelines above
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Submit a pull request** with:
   - Clear title and description
   - Reference to any related issues
   - Screenshots for UI changes
   - Testing instructions

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Tested on macOS
- [ ] Tested on Windows
- [ ] Tested on Linux
- [ ] Manual testing completed
- [ ] No TypeScript errors

## Screenshots (if applicable)
Add screenshots here

## Related Issues
Fixes #(issue number)
```

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:
- **Environment**: OS, Node.js version, npm version
- **Steps to reproduce**: Clear step-by-step instructions
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Console logs**: Any error messages

### Feature Requests

For feature requests, please include:
- **Problem description**: What problem does this solve?
- **Proposed solution**: How should it work?
- **Alternatives considered**: Other approaches you've thought of
- **Additional context**: Any other relevant information

## 🏗️ Architecture Guidelines

### Electron Security

- Always use `contextIsolation: true`
- Never enable `nodeIntegration` in renderer
- Use preload scripts for secure IPC
- Validate all data from renderer process

### SolidJS Best Practices

- Use signals for reactive state
- Prefer `createEffect` over `onMount` for side effects
- Keep components small and focused
- Use TypeScript interfaces for props

### State Management

- Use stores for shared state
- Keep local state in components when possible
- Persist user settings in localStorage
- Use IPC for main process communication

## 🎨 UI/UX Guidelines

### Design Principles

- **Consistency**: Follow existing design patterns
- **Accessibility**: Ensure keyboard navigation works
- **Responsiveness**: Support different window sizes
- **Performance**: Optimize for smooth interactions

### Tailwind CSS

- Use existing utility classes when possible
- Follow the design system in `tailwind.config.js`
- Prefer composition over custom CSS
- Use semantic color names

## 📚 Resources

### Documentation

- [Electron Documentation](https://www.electronjs.org/docs)
- [SolidJS Documentation](https://www.solidjs.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Google Cloud

- [Video Transcoder API](https://cloud.google.com/transcoder/docs)
- [Authentication Guide](https://cloud.google.com/docs/authentication)

## 🤝 Community

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Assume good intentions

### Getting Help

- Check existing issues and documentation first
- Ask questions in GitHub Discussions
- Be specific about your problem
- Provide minimal reproducible examples

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributor graphs

Thank you for contributing to make this project better! 🎉

