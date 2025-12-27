output "service_account_email" {
  description = "Email of the Cloud Run service account"
  value       = google_service_account.cloud_run.email
}

output "service_account_id" {
  description = "ID of the Cloud Run service account"
  value       = google_service_account.cloud_run.id
}

output "deployer_service_account_email" {
  description = "Email of the deployer service account"
  value       = google_service_account.deployer.email
}

output "workload_identity_pool_name" {
  description = "Name of the Workload Identity Pool"
  value       = var.github_repository != "" ? google_iam_workload_identity_pool.github[0].name : ""
}

output "workload_identity_provider" {
  description = "Full name of the Workload Identity Provider"
  value       = var.github_repository != "" ? google_iam_workload_identity_pool_provider.github[0].name : ""
}
