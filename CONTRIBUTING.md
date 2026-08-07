# Contributing to Crevio

Thank you for your interest in contributing to the Academic Contract Event Management System!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit with clear messages: `git commit -m "Add: feature description"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Guidelines

### Code Style

- Use TypeScript for all new files
- Follow existing code formatting (use ESLint)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Component Guidelines

- Place reusable components in `src/components/`
- Place page components in `src/pages/`
- Use functional components with hooks
- Implement proper TypeScript types/interfaces
- Use Tailwind CSS for styling

### Commit Message Format

```
Type: Brief description

Detailed description (if needed)
```

**Types:**
- `Add:` New feature or component
- `Fix:` Bug fix
- `Update:` Update existing feature
- `Refactor:` Code refactoring
- `Style:` UI/styling changes
- `Docs:` Documentation changes
- `Test:` Adding or updating tests

### Testing

- Write unit tests for utility functions
- Test components with React Testing Library
- Ensure all tests pass before submitting PR
- Add E2E tests for critical user flows

### Pull Request Process

1. Update README.md if needed
2. Ensure all tests pass
3. Update documentation
4. Request review from maintainers
5. Address review comments
6. Wait for approval and merge

## Project Structure

- `src/components/` - Reusable UI components
- `src/pages/` - Page components
- `src/contexts/` - React contexts
- `src/hooks/` - Custom hooks
- `src/lib/` - Utilities and helpers
- `src/test/` - Test files

## Questions?

Feel free to open an issue for any questions or concerns.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

Thank you for contributing to Crevio! 🎉
