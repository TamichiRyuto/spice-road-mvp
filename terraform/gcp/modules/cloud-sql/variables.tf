variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud SQL instance"
  type        = string
}

variable "instance_name" {
  description = "Name of the Cloud SQL instance"
  type        = string
}

variable "database_version" {
  description = "PostgreSQL database version"
  type        = string
  default     = "POSTGRES_16"
}

variable "tier" {
  description = "Machine tier for Cloud SQL instance"
  type        = string
  default     = "db-f1-micro"
}

variable "availability_type" {
  description = "Availability type (ZONAL or REGIONAL)"
  type        = string
  default     = "ZONAL"
}

variable "disk_type" {
  description = "Disk type (PD_SSD or PD_HDD)"
  type        = string
  default     = "PD_SSD"
}

variable "disk_size" {
  description = "Disk size in GB"
  type        = number
  default     = 10
}

variable "disk_autoresize" {
  description = "Enable automatic disk resize"
  type        = bool
  default     = true
}

variable "backup_enabled" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_start_time" {
  description = "Backup start time (HH:MM format)"
  type        = string
  default     = "03:00"
}

variable "point_in_time_recovery_enabled" {
  description = "Enable point-in-time recovery"
  type        = bool
  default     = true
}

variable "transaction_log_retention_days" {
  description = "Transaction log retention days"
  type        = number
  default     = 7
}

variable "retained_backups" {
  description = "Number of backups to retain"
  type        = number
  default     = 7
}

variable "ipv4_enabled" {
  description = "Enable public IP"
  type        = bool
  default     = false
}

variable "private_network" {
  description = "VPC network for private IP"
  type        = string
  default     = null
}

variable "require_ssl" {
  description = "Require SSL for connections (mapped to ssl_mode: true=ENCRYPTED_ONLY, false=ALLOW_UNENCRYPTED_AND_ENCRYPTED)"
  type        = bool
  default     = true
}

variable "authorized_networks" {
  description = "List of authorized networks for public IP access"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "maintenance_window_day" {
  description = "Maintenance window day (1-7, 1=Monday)"
  type        = number
  default     = 7
}

variable "maintenance_window_hour" {
  description = "Maintenance window hour (0-23)"
  type        = number
  default     = 3
}

variable "maintenance_window_update_track" {
  description = "Maintenance update track (stable or canary)"
  type        = string
  default     = "stable"
}

variable "max_connections" {
  description = "Maximum database connections"
  type        = string
  default     = "100"
}

variable "query_insights_enabled" {
  description = "Enable Query Insights"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "database_name" {
  description = "Name of the database to create"
  type        = string
  default     = "spice_road"
}

variable "db_user" {
  description = "Database user name"
  type        = string
  default     = "spice_user"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "service_account_email" {
  description = "Service account email for IAM authentication"
  type        = string
  default     = ""
}

variable "depends_on_resources" {
  description = "Resources this module depends on"
  type        = any
  default     = []
}
