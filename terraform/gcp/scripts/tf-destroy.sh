#!/bin/bash

# Terraform Destroy Wrapper Script
# Loads environment variables from .env file and runs terraform destroy
# Usage: ./scripts/tf-destroy.sh [terraform destroy options]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${RED}💣 Terraform Destroy Wrapper${NC}"
echo ""

# Change to terraform directory
cd "$TERRAFORM_DIR"

# Load .env file if it exists
if [ -f .env ]; then
    echo -e "${GREEN}✓ Loading environment variables from .env${NC}"

    # Source .env file (variables already have 'export' prefix)
    source .env

    # Validate required variables
    if [ -z "$GOOGLE_PROJECT" ]; then
        echo -e "${RED}✗ Error: GOOGLE_PROJECT is not set in .env${NC}"
        echo "  Please copy .env.example to .env and configure it."
        exit 1
    fi

    echo -e "${YELLOW}⚠ Target GCP Project: $GOOGLE_PROJECT${NC}"

    if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
        if [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
            echo -e "${GREEN}✓ Using service account: $GOOGLE_APPLICATION_CREDENTIALS${NC}"
        else
            echo -e "${RED}✗ Error: Service account key file not found: $GOOGLE_APPLICATION_CREDENTIALS${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}ℹ Using gcloud application default credentials${NC}"
    fi
else
    echo -e "${RED}✗ Error: .env file not found${NC}"
    echo "  Please copy .env.example to .env and configure your GCP credentials"
    exit 1
fi

echo ""
echo -e "${RED}⚠⚠⚠ DANGER: This will DESTROY all infrastructure in your GCP project! ⚠⚠⚠${NC}"
echo -e "${RED}  Project: $GOOGLE_PROJECT${NC}"
echo -e "${RED}  This action is IRREVERSIBLE!${NC}"
echo ""
echo "Type the project ID to confirm: $GOOGLE_PROJECT"
read -r CONFIRM_PROJECT

if [[ "$CONFIRM_PROJECT" != "$GOOGLE_PROJECT" ]]; then
    echo -e "${RED}✗ Project ID mismatch. Aborted.${NC}"
    exit 1
fi

echo ""
read -p "Are you ABSOLUTELY sure you want to destroy all resources? (type 'yes' to confirm) " -r
echo

if [[ ! $REPLY == "yes" ]]; then
    echo -e "${RED}✗ Aborted${NC}"
    exit 1
fi

echo ""
echo -e "${RED}💣 Running terraform destroy...${NC}"
echo ""

# Run terraform destroy with any additional arguments
# Use -var to pass GOOGLE_PROJECT from environment
terraform destroy \
    -var="project_id=$GOOGLE_PROJECT" \
    "$@"

echo ""
echo -e "${GREEN}✅ Terraform destroy complete!${NC}"
