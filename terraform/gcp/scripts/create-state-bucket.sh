#!/bin/bash

# Create GCS Bucket for Terraform State
# This script creates a GCS bucket for storing Terraform state files
# Usage: ./scripts/create-state-bucket.sh [bucket-name]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Terraform State Bucket Creator${NC}"
echo ""

# Change to terraform directory
cd "$TERRAFORM_DIR"

# Load .env file if it exists
if [ -f .env ]; then
    echo -e "${GREEN}Loading environment variables from .env${NC}"
    source .env
else
    echo -e "${YELLOW}.env file not found, using gcloud config${NC}"
fi

# Get project ID
PROJECT_ID="${GOOGLE_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: Project ID not found${NC}"
    echo "  Please set GOOGLE_PROJECT in .env or run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

# Get region
REGION="${GOOGLE_REGION:-asia-northeast1}"

# Determine bucket name
if [ -n "$1" ]; then
    BUCKET_NAME="$1"
else
    BUCKET_NAME="${PROJECT_ID}-terraform-state"
fi

echo ""
echo -e "${BLUE}Configuration:${NC}"
echo -e "  Project ID:  ${GREEN}$PROJECT_ID${NC}"
echo -e "  Region:      ${GREEN}$REGION${NC}"
echo -e "  Bucket Name: ${GREEN}$BUCKET_NAME${NC}"
echo ""

# Check if bucket already exists
if gsutil ls -b "gs://$BUCKET_NAME" &>/dev/null; then
    echo -e "${YELLOW}Bucket already exists: gs://$BUCKET_NAME${NC}"
    echo ""
    echo -e "${GREEN}You can initialize Terraform with:${NC}"
    echo -e "  ./scripts/tf-init.sh -backend-config=\"bucket=$BUCKET_NAME\""
    exit 0
fi

# Confirm creation
echo -e "${YELLOW}This will create a GCS bucket for Terraform state storage.${NC}"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Cancelled.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Creating bucket...${NC}"

# Create the bucket
gsutil mb -p "$PROJECT_ID" -l "$REGION" -b on "gs://$BUCKET_NAME"

# Enable versioning for state file protection
echo -e "${GREEN}Enabling versioning...${NC}"
gsutil versioning set on "gs://$BUCKET_NAME"

# Set lifecycle rule to delete old versions after 30 days
echo -e "${GREEN}Setting lifecycle rules...${NC}"
cat > /tmp/lifecycle.json << 'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "numNewerVersions": 5,
          "isLive": false
        }
      }
    ]
  }
}
EOF
gsutil lifecycle set /tmp/lifecycle.json "gs://$BUCKET_NAME"
rm /tmp/lifecycle.json

# Set uniform bucket-level access
echo -e "${GREEN}Setting uniform bucket-level access...${NC}"
gsutil uniformbucketlevelaccess set on "gs://$BUCKET_NAME"

echo ""
echo -e "${GREEN}Bucket created successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo -e "1. Initialize Terraform with the backend:"
echo -e "   ${GREEN}./scripts/tf-init.sh -backend-config=\"bucket=$BUCKET_NAME\"${NC}"
echo ""
echo -e "2. Or add to backend.tfvars:"
echo -e "   ${GREEN}echo 'bucket = \"$BUCKET_NAME\"' > backend.tfvars${NC}"
echo -e "   ${GREEN}./scripts/tf-init.sh -backend-config=backend.tfvars${NC}"
echo ""
echo -e "${YELLOW}Note: Add 'backend.tfvars' to .gitignore if it contains sensitive info.${NC}"
