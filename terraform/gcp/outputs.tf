output "artifact_registry_repository_id" {
  description = "ID of the Artifact Registry repository"
  value       = module.artifact_registry.repository_id
}

output "artifact_registry_repository_url" {
  description = "URL of the Artifact Registry repository"
  value       = module.artifact_registry.repository_url
}

output "cpp_api_service_url" {
  description = "URL of the C++ API Cloud Run service"
  value       = length(module.cloud_run_cpp_api) > 0 ? module.cloud_run_cpp_api[0].service_url : "Not deployed - cpp_api_image not provided"
}

output "frontend_service_url" {
  description = "URL of the Frontend Cloud Run service (main entry point)"
  value       = length(module.cloud_run_frontend) > 0 ? module.cloud_run_frontend[0].service_url : "Not deployed - frontend_image not provided"
}

output "service_account_email" {
  description = "Email of the service account for Cloud Run"
  value       = module.iam.service_account_email
}

output "workload_identity_provider" {
  description = "Workload Identity Provider for GitHub Actions"
  value       = module.iam.workload_identity_provider
}

output "cloud_sql_instance_name" {
  description = "Name of the Cloud SQL instance"
  value       = module.cloud_sql.instance_name
}

output "cloud_sql_connection_name" {
  description = "Connection name for Cloud SQL instance"
  value       = module.cloud_sql.instance_connection_name
}

output "cloud_sql_database_name" {
  description = "Name of the database"
  value       = module.cloud_sql.database_name
}

output "cloud_sql_password_secret_id" {
  description = "Secret Manager secret ID for Cloud SQL password"
  value       = google_secret_manager_secret.cloud_sql_password.secret_id
}

output "redis_host" {
  description = "Redis instance host"
  value       = module.memorystore.host
}

output "redis_port" {
  description = "Redis instance port"
  value       = module.memorystore.port
}

output "redis_connection_string" {
  description = "Redis connection string"
  value       = module.memorystore.connection_string
}
