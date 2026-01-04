resource "google_cloud_run_v2_service" "main" {
  name     = var.service_name
  location = var.region
  project  = var.project_id

  labels = var.labels

  template {
    service_account = var.service_account_email
    timeout         = "300s"  # 5 minutes timeout for container startup

    containers {
      image = var.image

      ports {
        container_port = var.port
      }

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
      }

      dynamic "env" {
        for_each = var.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      # Startup probe - give more time for C++ applications
      dynamic "startup_probe" {
        for_each = var.enable_health_checks ? [1] : []
        content {
          initial_delay_seconds = 0
          timeout_seconds       = 10
          period_seconds        = 10
          failure_threshold     = 30  # 30 * 10s = 5 minutes max startup time

          http_get {
            path = var.health_check_path
            port = var.port
          }
        }
      }

      # Liveness probe
      dynamic "liveness_probe" {
        for_each = var.enable_health_checks ? [1] : []
        content {
          initial_delay_seconds = 0
          timeout_seconds       = 5
          period_seconds        = 30
          failure_threshold     = 3

          http_get {
            path = var.health_check_path
            port = var.port
          }
        }
      }

      # Mount Cloud SQL Unix socket volume
      dynamic "volume_mounts" {
        for_each = length(var.cloud_sql_instances) > 0 ? [1] : []
        content {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }
    }

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    # Cloud SQL Unix socket connection
    dynamic "volumes" {
      for_each = length(var.cloud_sql_instances) > 0 ? [1] : []
      content {
        name = "cloudsql"
        cloud_sql_instance {
          instances = var.cloud_sql_instances
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [var.depends_on_resources]
}

resource "google_cloud_run_v2_service_iam_member" "public_access" {
  count = var.allow_unauthenticated ? 1 : 0

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.main.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
