variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "artifact_registry_location" {
  description = "Location of Artifact Registry"
  type        = string
}

variable "repository_id" {
  description = "Artifact Registry repository ID"
  type        = string
}

variable "github_repository" {
  description = "GitHub repository in format 'owner/repo' (e.g., 'TamichiRyuto/spice-road-mvp')"
  type        = string
}

variable "git_ref" {
  description = "Git reference (branch, tag, or commit SHA) to build from"
  type        = string
  default     = "main"
}

variable "enable_cpp_api_build" {
  description = "Enable C++ API Docker build via Cloud Build"
  type        = bool
  default     = false
}

variable "enable_frontend_build" {
  description = "Enable Frontend Docker build via Cloud Build"
  type        = bool
  default     = false
}

variable "cpp_api_subdirectory" {
  description = "Subdirectory containing C++ API source code"
  type        = string
  default     = "cpp-api"
}

variable "frontend_subdirectory" {
  description = "Subdirectory containing Frontend source code"
  type        = string
  default     = "frontend"
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}

variable "depends_on_resources" {
  description = "Resources this module depends on"
  type        = list(any)
  default     = []
}
