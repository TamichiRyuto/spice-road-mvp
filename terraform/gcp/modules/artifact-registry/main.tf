resource "google_artifact_registry_repository" "main" {
  location      = var.location
  repository_id = var.repository_id
  description   = var.description
  format        = var.format
  project       = var.project_id
  labels        = var.labels

  cleanup_policy_dry_run = false
}
