output "cpp_api_image_built" {
  description = "Whether C++ API image was built"
  value       = var.enable_cpp_api_build
}

output "frontend_image_built" {
  description = "Whether Frontend image was built"
  value       = var.enable_frontend_build
}

output "cpp_api_image_url" {
  description = "URL of the built C++ API Docker image"
  value       = var.enable_cpp_api_build ? "${var.artifact_registry_location}-docker.pkg.dev/${var.project_id}/${var.repository_id}/cpp-api:latest" : ""
}

output "frontend_image_url" {
  description = "URL of the built Frontend Docker image"
  value       = var.enable_frontend_build ? "${var.artifact_registry_location}-docker.pkg.dev/${var.project_id}/${var.repository_id}/frontend:latest" : ""
}
