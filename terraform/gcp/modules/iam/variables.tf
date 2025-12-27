variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "github_repository" {
  description = "GitHub repository in format 'owner/repo'"
  type        = string
  default     = ""
}

variable "workload_identity_pool_id" {
  description = "ID for the Workload Identity Pool"
  type        = string
  default     = "github-pool"
}

variable "workload_identity_provider_id" {
  description = "ID for the Workload Identity Provider"
  type        = string
  default     = "github-provider"
}
