variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "location" {
  description = "Location for the Artifact Registry repository"
  type        = string
}

variable "repository_id" {
  description = "ID of the Artifact Registry repository"
  type        = string
}

variable "format" {
  description = "Format of the repository (DOCKER, NPM, etc.)"
  type        = string
  default     = "DOCKER"
}

variable "description" {
  description = "Description of the repository"
  type        = string
  default     = ""
}

variable "labels" {
  description = "Labels to apply to the repository"
  type        = map(string)
  default     = {}
}
