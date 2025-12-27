variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region for Memorystore instance"
  type        = string
}

variable "instance_name" {
  description = "Name of the Memorystore Redis instance"
  type        = string
}

variable "tier" {
  description = "Service tier of the instance (BASIC or STANDARD_HA)"
  type        = string
  default     = "BASIC"
}

variable "memory_size_gb" {
  description = "Memory size in GiB"
  type        = number
  default     = 1
}

variable "redis_version" {
  description = "Redis version"
  type        = string
  default     = "REDIS_7_0"
}

variable "display_name" {
  description = "Display name for the instance"
  type        = string
  default     = ""
}

variable "reserved_ip_range" {
  description = "CIDR range for the instance"
  type        = string
  default     = ""
}

variable "auth_enabled" {
  description = "Enable AUTH for the instance"
  type        = bool
  default     = false
}

variable "transit_encryption_mode" {
  description = "Transit encryption mode (SERVER_AUTHENTICATION or DISABLED)"
  type        = string
  default     = "DISABLED"
}

variable "redis_configs" {
  description = "Redis configuration parameters"
  type        = map(string)
  default     = {}
}

variable "labels" {
  description = "Labels to apply to the instance"
  type        = map(string)
  default     = {}
}

variable "depends_on_resources" {
  description = "Resources that this module depends on"
  type        = list(any)
  default     = []
}
