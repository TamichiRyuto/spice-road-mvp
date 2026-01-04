#!/bin/bash

# Terraform Apply Wrapper Script
# Loads environment variables from .env file and runs terraform apply
# Usage: ./scripts/tf-apply.sh [terraform apply options]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Terraform Apply Wrapper${NC}"
echo ""

# Change to terraform directory
cd "$TERRAFORM_DIR"

# Load .env file if it exists
if [ -f .env ]; then
    echo -e "${GREEN}Loading environment variables from .env${NC}"

    # Source .env file (variables already have 'export' prefix)
    source .env

    # Validate required variables
    if [ -z "$GOOGLE_PROJECT" ]; then
        echo -e "${RED}Error: GOOGLE_PROJECT is not set in .env${NC}"
        echo "  Please copy .env.example to .env and configure it."
        exit 1
    fi

    echo -e "${GREEN}Using GCP Project: $GOOGLE_PROJECT${NC}"

    if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
        if [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
            echo -e "${GREEN}Using service account: $GOOGLE_APPLICATION_CREDENTIALS${NC}"
        else
            echo -e "${RED}Error: Service account key file not found: $GOOGLE_APPLICATION_CREDENTIALS${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}Using gcloud application default credentials${NC}"
    fi
else
    echo -e "${RED}Error: .env file not found${NC}"
    echo "  Please copy .env.example to .env and configure your GCP credentials"
    exit 1
fi

# Check if terraform is initialized
if [ ! -d .terraform ]; then
    echo ""
    echo -e "${YELLOW}Terraform not initialized. Running init first...${NC}"
    echo ""
    ./scripts/tf-init.sh
    echo ""
fi

echo ""
echo -e "${YELLOW}WARNING: This will apply changes to your GCP infrastructure!${NC}"
echo -e "${YELLOW}  Project: $GOOGLE_PROJECT${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no) " -r
echo

if [[ ! $REPLY == "yes" ]]; then
    echo -e "${RED}Aborted${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Running terraform apply...${NC}"
echo ""

# Run terraform apply with any additional arguments
# Use -var to pass GOOGLE_PROJECT from environment
terraform apply \
    -var="project_id=$GOOGLE_PROJECT" \
    "$@"

echo ""
echo -e "${GREEN}Terraform apply complete!${NC}"
