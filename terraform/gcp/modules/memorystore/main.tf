resource "google_redis_instance" "cache" {
  name           = var.instance_name
  tier           = var.tier
  memory_size_gb = var.memory_size_gb
  region         = var.region
  project        = var.project_id

  redis_version     = var.redis_version
  display_name      = var.display_name
  reserved_ip_range = var.reserved_ip_range

  auth_enabled            = var.auth_enabled
  transit_encryption_mode = var.transit_encryption_mode

  redis_configs = var.redis_configs

  labels = var.labels

  depends_on = [var.depends_on_resources]
}
