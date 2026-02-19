# Release Guide

This document explains how to release your Gemini CLI extension.

## Setup (Complete ✓)

- [x] Git repository initialized
- [x] GitHub Actions workflow created
- [x] Extension built successfully
- [x] Initial commit created

## Next Steps

### 1. Create GitHub Repository

1. Go to https://github.com/new
2. Create a new **public** repository
3. Name it: `release-notes-generator` (or your preferred name)
4. **Don't** initialize with README (we already have one)

### 2. Push to GitHub

```bash
# Add your GitHub repository as remote (replace with your username)
git remote add origin https://github.com/YOUR_USERNAME/release-notes-generator.git

# Push your code
git push -u origin main
```

### 3. Add GitHub Topic

To list your extension in the Gemini CLI gallery:

1. Go to your repository on GitHub
2. Click the ⚙️ gear icon next to "About" (top right)
3. Add the topic: `gemini-cli-extension`
4. Click "Save changes"

### 4. Create Your First Release

#### Option A: Using GitHub Web Interface

1. Go to your repository → Releases → "Create a new release"
2. Click "Choose a tag" → Type `v1.0.0` → "Create new tag"
3. Set release title: `v1.0.0`
4. The GitHub Actions workflow will automatically build and attach the archive
5. Click "Publish release"

#### Option B: Using Git Tags

```bash
# Create and push a tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

The GitHub Actions workflow will automatically:
- Build your extension
- Create a release archive
- Create a GitHub Release with the archive attached

### 5. Verify Installation

Users can install your extension with:

```bash
# Install from main branch (latest)
gemini extensions install https://github.com/YOUR_USERNAME/release-notes-generator

# Install specific version
gemini extensions install https://github.com/YOUR_USERNAME/release-notes-generator --ref=v1.0.0
```

## Future Releases

### Semantic Versioning

Use semantic versioning for your releases:

- **v1.0.0** → **v1.0.1**: Bug fixes (PATCH)
- **v1.0.0** → **v1.1.0**: New features, backward compatible (MINOR)
- **v1.0.0** → **v2.0.0**: Breaking changes (MAJOR)

### Release Process

1. **Update version in `gemini-extension.json`**:
   ```json
   {
     "version": "1.1.0"
   }
   ```

2. **Commit and push**:
   ```bash
   git add gemini-extension.json
   git commit -m "Bump version to 1.1.0"
   git push
   ```

3. **Create and push tag**:
   ```bash
   git tag -a v1.1.0 -m "Release v1.1.0"
   git push origin v1.1.0
   ```

4. **GitHub Actions automatically builds and releases**

## Gallery Listing

Your extension will appear in the [Gemini CLI extension gallery](https://geminicli.com/extensions/browse/) within 24 hours after:

1. Repository is public ✓
2. `gemini-cli-extension` topic is added
3. `gemini-extension.json` is at repository root ✓
4. Repository is tagged with a version

## Support

If your extension doesn't appear in the gallery after 24 hours, verify:

- Repository is public
- `gemini-cli-extension` topic is added
- `gemini-extension.json` is valid JSON and at root
- At least one git tag exists
