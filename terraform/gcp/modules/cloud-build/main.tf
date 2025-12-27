# Cloud Build module to build Docker images from GitHub repository
# This allows terraform apply to automatically build and push Docker images

# Build C++ API image using Cloud Build from GitHub
resource "null_resource" "build_cpp_api" {
  count = var.enable_cpp_api_build ? 1 : 0

  triggers = {
    # Rebuild when triggered (can be controlled via terraform taint or variables)
    git_ref = var.git_ref
  }

  provisioner "local-exec" {
    command = <<-EOT
      gcloud builds submit \
        --project=${var.project_id} \
        --tag=${var.artifact_registry_location}-docker.pkg.dev/${var.project_id}/${var.repository_id}/cpp-api:latest \
        --timeout=30m \
        https://github.com/${var.github_repository}.git#${var.git_ref}:${var.cpp_api_subdirectory}
    EOT
  }

  depends_on = [var.depends_on_resources]
}

# Build Frontend image using Cloud Build from GitHub
resource "null_resource" "build_frontend" {
  count = var.enable_frontend_build ? 1 : 0

  triggers = {
    # Rebuild when triggered (can be controlled via terraform taint or variables)
    git_ref = var.git_ref
  }

  provisioner "local-exec" {
    command = <<-EOT
      gcloud builds submit \
        --project=${var.project_id} \
        --tag=${var.artifact_registry_location}-docker.pkg.dev/${var.project_id}/${var.repository_id}/frontend:latest \
        --timeout=20m \
        https://github.com/${var.github_repository}.git#${var.git_ref}:${var.frontend_subdirectory}
    EOT
  }

  depends_on = [var.depends_on_resources]
}
