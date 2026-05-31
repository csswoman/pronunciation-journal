#!/bin/bash

# Setup GitHub Actions secrets for CI/CD deployment
# Usage: ./scripts/setup-deployment.sh

set -e

echo "🚀 Setting up GitHub Actions secrets for english-journal deployment..."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Install it from: https://cli.github.com"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub. Run: gh auth login"
    exit 1
fi

echo "📋 Required secrets to set:"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - VERCEL_TOKEN"
echo "  - VERCEL_ORG_ID"
echo "  - VERCEL_PROJECT_ID"
echo "  - DATABASE_URL (optional, for migrations)"
echo ""

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_value=$2

    if [ -z "$secret_value" ]; then
        echo "⏭️  Skipping $secret_name (empty)"
        return
    fi

    echo -n "$secret_value" | gh secret set "$secret_name" --repo "$(gh repo view --json nameWithOwner -q .nameWithOwner)"
    echo "✅ Set $secret_name"
}

# Interactive setup
read -p "Enter NEXT_PUBLIC_SUPABASE_URL: " supabase_url
set_secret "NEXT_PUBLIC_SUPABASE_URL" "$supabase_url"

read -p "Enter NEXT_PUBLIC_SUPABASE_ANON_KEY: " supabase_key
set_secret "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$supabase_key"

read -p "Enter VERCEL_TOKEN: " vercel_token
set_secret "VERCEL_TOKEN" "$vercel_token"

read -p "Enter VERCEL_ORG_ID: " vercel_org_id
set_secret "VERCEL_ORG_ID" "$vercel_org_id"

read -p "Enter VERCEL_PROJECT_ID: " vercel_project_id
set_secret "VERCEL_PROJECT_ID" "$vercel_project_id"

read -p "Enter DATABASE_URL (optional, press Enter to skip): " database_url
set_secret "DATABASE_URL" "$database_url"

echo ""
echo "✅ Secrets configured successfully!"
echo ""
echo "📚 Next steps:"
echo "  1. Configure branch protection for 'main' in GitHub settings"
echo "  2. Verify secrets: gh secret list"
echo "  3. Push a test commit to main to trigger CI/CD pipeline"
echo ""
echo "📖 For more info, see: DEPLOYMENT.md"
