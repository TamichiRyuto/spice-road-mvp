#!/bin/bash

# Terraform Init Wrapper Script
# Loads environment variables from .env file and runs terraform init
# Usage: ./scripts/tf-init.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN} Terraform Init Wrapper${NC}"
echo ""

# Change to terraform directory
cd "$TERRAFORM_DIR"

# Load .env file if it exists
if [ -f .env ]; then
    echo -e "${GREEN} Loading environment variables from .env${NC}"

    # Source .env file (variables already have 'export' prefix)
    source .env

    # Validate required variables
    if [ -z "$GOOGLE_PROJECT" ]; then
        echo -e "${RED} Error: GOOGLE_PROJECT is not set in .env${NC}"
        echo "  Please copy .env.example to .env and configure it."
        exit 1
    fi

    if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ] && [ -z "$(gcloud config get-value account 2>/dev/null)" ]; then
        echo -e "${YELLOW} Warning: Neither GOOGLE_APPLICATION_CREDENTIALS nor gcloud auth is configured${NC}"
        echo "  Please either:"
        echo "    1. Set GOOGLE_APPLICATION_CREDENTIALS in .env"
        echo "    2. Run: gcloud auth application-default login"
    fi

    echo -e "${GREEN} Using GCP Project: $GOOGLE_PROJECT${NC}"

    if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
        if [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
            echo -e "${GREEN} Using service account: $GOOGLE_APPLICATION_CREDENTIALS${NC}"
        else
            echo -e "${RED} Error: Service account key file not found: $GOOGLE_APPLICATION_CREDENTIALS${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW} Using gcloud application default credentials${NC}"
    fi
else
    echo -e "${YELLOW} Warning: .env file not found${NC}"
    echo "  Copy .env.example to .env and configure your GCP credentials"
    echo "  Or use: gcloud auth application-default login"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# Check for TF_BACKEND_BUCKET and add backend config if set
BACKEND_ARGS=()
if [ -n "$TF_BACKEND_BUCKET" ]; then
    echo -e "${GREEN} Using Terraform state bucket: $TF_BACKEND_BUCKET${NC}"
    BACKEND_ARGS+=("-backend-config=bucket=$TF_BACKEND_BUCKET")
else
    echo -e "${YELLOW} TF_BACKEND_BUCKET not set in .env${NC}"
    echo "  Terraform will prompt for bucket name or use existing backend config"
    echo ""
    echo "  To set automatically, add to .env:"
    echo "    TF_BACKEND_BUCKET=\"${GOOGLE_PROJECT}-terraform-state\""
    echo ""
fi

echo -e "${GREEN} Running terraform init...${NC}"
echo ""

# Run terraform init with backend config and any additional arguments
terraform init "${BACKEND_ARGS[@]}" "$@"

echo ""
echo -e "${GREEN} Terraform initialization complete!${NC}"
