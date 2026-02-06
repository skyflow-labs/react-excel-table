# Contributing to react-sheet-table

Thanks for your interest in making this library better! Every contribution helps.

## Ways to Contribute

### Give Feedback

The easiest way to help:

- **Star the repo** if you find it useful
- **Share your experience** - How are you using it? What works well?
- **Report issues** - Found a bug? Let us know
- **Suggest features** - What would make this library more useful for you?

### Report a Bug

Open an issue with:

1. What you expected to happen
2. What actually happened
3. Steps to reproduce
4. Your environment (React version, browser, OS)

A code snippet or screenshot helps a lot.

### Suggest a Feature

Open an issue describing:

1. The problem you're trying to solve
2. How you'd like it to work
3. Why this would be useful to others

### Improve Documentation

Found something confusing in the docs? PRs welcome for:

- Fixing typos
- Adding examples
- Clarifying explanations
- Translating to other languages

### Submit Code

1. Fork the repo
2. Create a branch: `git checkout -b my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Push and open a PR

## Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/react-sheet-table.git
cd react-sheet-table
npm install
npm test        # Run tests
npm run build   # Build library
```

## Project Structure

```
src/
├── components/    # React components (cell/, table/, controls/)
├── hooks/         # React hooks
├── plugins/       # Import/Export plugins
├── utils/         # Formatters, autosize, security
├── config/        # Provider and configuration
├── types/         # TypeScript definitions
└── __tests__/     # Tests
```

## Code Guidelines

- **TypeScript** - No `any` types, add JSDoc to public APIs
- **Tests** - Add tests for new features
- **Commits** - Use clear messages: `fix: resolve issue`, `feat: add feature`

## Questions?

- Open an issue for bugs or features
- Start a discussion for questions

Every bit of feedback helps make this library better. Thank you!
