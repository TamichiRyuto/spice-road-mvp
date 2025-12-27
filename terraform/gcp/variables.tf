variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region for resources"
  type        = string
  default     = "asia-northeast1"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "spice-road"
}

# Artifact Registry variables
variable "artifact_registry_location" {
  description = "Location for Artifact Registry"
  type        = string
  default     = "asia-northeast1"
}

variable "artifact_registry_format" {
  description = "Format of Artifact Registry repository"
  type        = string
  default     = "DOCKER"
}

# Cloud Run variables
variable "cpp_api_image" {
  description = "Docker image for C++ API"
  type        = string
  default     = ""
}

variable "frontend_image" {
  description = "Docker image for Frontend"
  type        = string
  default     = ""
}

variable "cpp_api_memory" {
  description = "Memory allocation for C++ API service"
  type        = string
  default     = "2Gi"
}

variable "cpp_api_cpu" {
  description = "CPU allocation for C++ API service"
  type        = string
  default     = "2"
}

variable "frontend_memory" {
  description = "Memory allocation for Frontend service"
  type        = string
  default     = "512Mi"
}

variable "frontend_cpu" {
  description = "CPU allocation for Frontend service"
  type        = string
  default     = "1"
}

variable "allow_unauthenticated" {
  description = "Allow unauthenticated access to Cloud Run services"
  type        = bool
  default     = true
}

# IAM variables
variable "github_repository" {
  description = "GitHub repository in format 'owner/repo'"
  type        = string
  default     = ""
}

variable "git_ref" {
  description = "Git reference (branch, tag, or commit SHA) to build from"
  type        = string
  default     = "main"
}

variable "enable_cloud_build" {
  description = "Enable automatic Docker image building via Cloud Build from GitHub"
  type        = bool
  default     = false
}

variable "workload_identity_pool_id" {
  description = "Workload Identity Pool ID"
  type        = string
  default     = "github-pool"
}

variable "workload_identity_provider_id" {
  description = "Workload Identity Provider ID"
  type        = string
  default     = "github-provider"
}

# Cloud SQL variables
variable "cloud_sql_database_version" {
  description = "PostgreSQL database version"
  type        = string
  default     = "POSTGRES_16"
}

variable "cloud_sql_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-f1-micro"
}

variable "cloud_sql_availability_type" {
  description = "Cloud SQL availability type (ZONAL or REGIONAL)"
  type        = string
  default     = "ZONAL"
}

variable "cloud_sql_disk_size" {
  description = "Cloud SQL disk size in GB"
  type        = number
  default     = 10
}

variable "cloud_sql_database_name" {
  description = "Name of the database to create"
  type        = string
  default     = "spice_road"
}

variable "cloud_sql_user" {
  description = "Database user name"
  type        = string
  default     = "spice_user"
}

# cloud_sql_password is now auto-generated and stored in Secret Manager
# See: google_secret_manager_secret.cloud_sql_password in main.tf

variable "cloud_sql_authorized_networks" {
  description = "List of authorized networks for Cloud SQL public IP access"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

# Redis/Memorystore variables
variable "redis_tier" {
  description = "Redis tier (BASIC or STANDARD_HA)"
  type        = string
  default     = "BASIC"
}

variable "redis_memory_size_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 1
}

variable "redis_version" {
  description = "Redis version"
  type        = string
  default     = "REDIS_7_0"
}

variable "redis_auth_enabled" {
  description = "Enable AUTH for Redis"
  type        = bool
  default     = false
}

# Tags
variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default = {
    application = "spice-road"
    managed_by  = "terraform"
  }
}
