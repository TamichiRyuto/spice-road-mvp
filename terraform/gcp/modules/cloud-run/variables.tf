variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region for the Cloud Run service"
  type        = string
}

variable "service_name" {
  description = "Name of the Cloud Run service"
  type        = string
}

variable "image" {
  description = "Docker image to deploy"
  type        = string
}

variable "port" {
  description = "Port on which the container listens"
  type        = number
  default     = 8080
}

variable "memory" {
  description = "Memory allocation for the service"
  type        = string
  default     = "512Mi"
}

variable "cpu" {
  description = "CPU allocation for the service"
  type        = string
  default     = "1"
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}

variable "env_vars" {
  description = "Environment variables for the service"
  type        = map(string)
  default     = {}
}

variable "allow_unauthenticated" {
  description = "Allow unauthenticated access to the service"
  type        = bool
  default     = false
}

variable "service_account_email" {
  description = "Service account email for the Cloud Run service"
  type        = string
}

variable "labels" {
  description = "Labels to apply to the service"
  type        = map(string)
  default     = {}
}

variable "depends_on_resources" {
  description = "Resources that this module depends on"
  type        = list(any)
  default     = []
}

variable "cloud_sql_instances" {
  description = "Cloud SQL instance connection names for Unix socket access"
  type        = list(string)
  default     = []
}

variable "enable_health_checks" {
  description = "Enable health check probes (startup and liveness)"
  type        = bool
  default     = true
}

variable "health_check_path" {
  description = "Path for health check endpoint"
  type        = string
  default     = "/health"
}
