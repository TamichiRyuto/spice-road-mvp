#!/bin/bash
export GOOGLE_APPLICATION_CREDENTIALS="/home/ryuto/hackathon202510/gcp-terraform-key.json"
export TF_VAR_project_id="kototech-dev"
export TF_VAR_region="asia-northeast2"
export TF_VAR_environment="dev"
export TF_VAR_app_name="spice-road-mvp"
export TF_VAR_google_maps_api_key="dummy"
export TF_VAR_github_repository="TamichiRyuto/spice-road-mvp"
export TF_VAR_git_ref="test123"
export TF_VAR_enable_cloud_build=false

echo "=== Test 1: Plan with -target=module.cloud_run_cpp_api only ==="
terraform plan -target=module.cloud_run_cpp_api 2>&1 | grep -A 5 -B 5 "cloud_sql_instances\|volumes"

echo ""
echo "=== Test 2: Check current state ==="
terraform state show 'module.cloud_run_cpp_api[0].google_cloud_run_v2_service.main' 2>&1 | grep -A 10 "volumes\|cloud_sql"
