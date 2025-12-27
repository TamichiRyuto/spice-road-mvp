# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "sqladmin.googleapis.com",
    "servicenetworking.googleapis.com",
    "redis.googleapis.com",
    "secretmanager.googleapis.com",
  ])

  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}

# Generate random password for Cloud SQL
resource "random_password" "cloud_sql_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store Cloud SQL password in Secret Manager
resource "google_secret_manager_secret" "cloud_sql_password" {
  secret_id = "${var.app_name}-cloud-sql-password-${var.environment}"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = var.labels

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "cloud_sql_password" {
  secret      = google_secret_manager_secret.cloud_sql_password.id
  secret_data = random_password.cloud_sql_password.result
}

# Artifact Registry Module
module "artifact_registry" {
  source = "./modules/artifact-registry"

  project_id  = var.project_id
  location    = var.artifact_registry_location
  repository_id = "${var.app_name}-${var.environment}"
  format      = var.artifact_registry_format
  description = "Docker images for ${var.app_name} application"
  labels      = var.labels

  depends_on = [google_project_service.required_apis]
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  project_id                     = var.project_id
  app_name                       = var.app_name
  environment                    = var.environment
  github_repository              = var.github_repository
  workload_identity_pool_id      = var.workload_identity_pool_id
  workload_identity_provider_id  = var.workload_identity_provider_id

  depends_on = [google_project_service.required_apis]
}

# Cloud SQL Module
module "cloud_sql" {
  source = "./modules/cloud-sql"

  project_id    = var.project_id
  region        = var.region
  instance_name = "${var.app_name}-postgres-${var.environment}"

  database_version  = var.cloud_sql_database_version
  tier              = var.cloud_sql_tier
  availability_type = var.cloud_sql_availability_type
  disk_size         = var.cloud_sql_disk_size

  database_name = var.cloud_sql_database_name
  db_user       = var.cloud_sql_user
  db_password   = random_password.cloud_sql_password.result

  service_account_email = module.iam.service_account_email

  deletion_protection = var.environment == "prod"

  # Enable public IP for development, use private IP for production
  ipv4_enabled      = var.environment != "prod"
  authorized_networks = var.cloud_sql_authorized_networks

  depends_on = [
    google_project_service.required_apis,
    module.iam
  ]
}

# Memorystore (Redis) Module
module "memorystore" {
  source = "./modules/memorystore"

  project_id    = var.project_id
  region        = var.region
  instance_name = "${var.app_name}-redis-${var.environment}"

  tier           = var.redis_tier
  memory_size_gb = var.redis_memory_size_gb
  redis_version  = var.redis_version

  display_name      = "Redis cache for ${var.app_name}"
  auth_enabled      = var.redis_auth_enabled

  labels = merge(var.labels, { component = "redis" })

  depends_on = [google_project_service.required_apis]
}

# Cloud Build Module - Build Docker images from GitHub
module "cloud_build" {
  source = "./modules/cloud-build"

  project_id                  = var.project_id
  region                      = var.region
  app_name                    = var.app_name
  artifact_registry_location  = var.artifact_registry_location
  repository_id               = module.artifact_registry.repository_name
  github_repository           = var.github_repository
  git_ref                     = var.git_ref

  enable_cpp_api_build        = var.enable_cloud_build
  enable_frontend_build       = var.enable_cloud_build
  cpp_api_subdirectory        = "cpp-api"
  frontend_subdirectory       = "frontend"

  labels = var.labels

  depends_on = [
    google_project_service.required_apis,
    module.artifact_registry
  ]
}

# Determine image URLs: use built images from Cloud Build if enabled, otherwise use provided images
locals {
  cpp_api_image_url  = var.enable_cloud_build ? module.cloud_build.cpp_api_image_url : var.cpp_api_image
  frontend_image_url = var.enable_cloud_build ? module.cloud_build.frontend_image_url : var.frontend_image
}

# Cloud Run Module - C++ API
# Only create if cpp_api_image is provided or Cloud Build is enabled
module "cloud_run_cpp_api" {
  source = "./modules/cloud-run"
  count  = (var.enable_cloud_build || var.cpp_api_image != "") ? 1 : 0

  project_id              = var.project_id
  region                  = var.region
  service_name            = "${var.app_name}-cpp-api-${var.environment}"
  image                   = local.cpp_api_image_url
  memory                  = var.cpp_api_memory
  cpu                     = var.cpp_api_cpu
  port                    = 8080
  allow_unauthenticated   = var.allow_unauthenticated
  service_account_email   = module.iam.service_account_email
  labels                  = merge(var.labels, { component = "cpp-api" })
  cloud_sql_instances     = [module.cloud_sql.instance_connection_name]

  env_vars = {
    API_PORT                = "8080"
    LOG_LEVEL               = "info"
    ENABLE_METRICS          = "true"
    DB_HOST                 = "/cloudsql/${module.cloud_sql.instance_connection_name}"
    DB_PORT                 = "5432"
    DB_NAME                 = module.cloud_sql.database_name
    DB_USER                 = module.cloud_sql.db_user
    DB_PASSWORD             = random_password.cloud_sql_password.result
    REDIS_HOST              = module.memorystore.host
    REDIS_PORT              = tostring(module.memorystore.port)
  }

  depends_on = [
    google_project_service.required_apis,
    module.artifact_registry,
    module.iam,
    module.cloud_sql,
    module.cloud_build
  ]
}

# Cloud Run Module - Frontend
# Only create if frontend_image is provided or Cloud Build is enabled
module "cloud_run_frontend" {
  source = "./modules/cloud-run"
  count  = (var.enable_cloud_build || var.frontend_image != "") ? 1 : 0

  project_id              = var.project_id
  region                  = var.region
  service_name            = "${var.app_name}-frontend-${var.environment}"
  image                   = local.frontend_image_url
  memory                  = var.frontend_memory
  cpu                     = var.frontend_cpu
  port                    = 3000
  allow_unauthenticated   = var.allow_unauthenticated
  service_account_email   = module.iam.service_account_email
  labels                  = merge(var.labels, { component = "frontend" })

  env_vars = {
    # Frontend calls API via /api path
    REACT_APP_API_URL           = "/api"
    REACT_APP_GOOGLE_MAPS_API_KEY = "DEMO_API_KEY"
  }

  depends_on = [
    google_project_service.required_apis,
    module.artifact_registry,
    module.iam,
    module.cloud_run_cpp_api,
    module.cloud_build
  ]
}
