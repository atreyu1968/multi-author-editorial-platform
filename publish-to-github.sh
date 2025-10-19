#!/bin/bash

###############################################################################
# Publish to GitHub - Multi-Author Editorial Platform
###############################################################################

set -e

REPO_URL="https://github.com/atreyu1968/multi-author-editorial-platform.git"
REPO_NAME="multi-author-editorial-platform"

echo "======================================================================"
echo "   Publishing to GitHub"
echo "======================================================================"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    echo "✓ Git initialized"
else
    echo "✓ Git repository already initialized"
fi

# Check if origin remote exists
if git remote get-url origin &>/dev/null; then
    echo "✓ Remote 'origin' already configured"
else
    echo "Adding remote 'origin'..."
    git remote add origin "$REPO_URL"
    echo "✓ Remote added: $REPO_URL"
fi

# Add all files
echo ""
echo "Adding files to git..."
git add .

# Show status
echo ""
echo "Files to be committed:"
git status --short

# Create commit
echo ""
read -p "Enter commit message (default: 'Initial commit - Multi-author editorial platform v1.0'): " COMMIT_MSG
COMMIT_MSG=${COMMIT_MSG:-"Initial commit - Multi-author editorial platform v1.0"}

git commit -m "$COMMIT_MSG"
echo "✓ Commit created"

# Push to GitHub
echo ""
echo "Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "======================================================================"
echo "✓ Code successfully published to GitHub!"
echo "======================================================================"
echo ""
echo "Repository: https://github.com/atreyu1968/$REPO_NAME"
echo ""
echo "Next steps:"
echo "1. Visit your repository on GitHub"
echo "2. Add repository topics for better discoverability"
echo "3. Consider adding a LICENSE file"
echo "4. Enable branch protection (optional)"
echo ""
