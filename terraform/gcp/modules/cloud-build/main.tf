# Cloud Build module to build Docker images from GitHub repository
# This allows terraform apply to automatically build and push Docker images
# Uses cloudbuild.yaml files in each subdirectory for build configuration

# Get current commit hash from git_ref
# This will trigger rebuilds when the commit hash changes
locals {
  # Get the short commit hash (7 characters) for image tagging
  commit_hash = substr(sha256(var.git_ref), 0, 7)

  # Calculate hash of source directories to detect code changes
  cpp_api_source_hash  = try(sha256(join("", [for f in fileset("${path.root}/../../cpp-api", "**") : filesha256("${path.root}/../../cpp-api/${f}")])), "initial")
  frontend_source_hash = try(sha256(join("", [for f in fileset("${path.root}/../../frontend", "**") : filesha256("${path.root}/../../frontend/${f}")])), "initial")

  # Image tags using git_ref (which can be branch name, tag, or commit SHA)
  # We sanitize it to be a valid Docker tag (alphanumeric, dots, dashes, underscores)
  image_tag = replace(replace(var.git_ref, "/", "-"), "refs-heads-", "")
}

# Build C++ API image using Cloud Build from GitHub
resource "null_resource" "build_cpp_api" {
  count = var.enable_cpp_api_build ? 1 : 0

  triggers = {
    # Rebuild when git ref changes
    git_ref = var.git_ref
    # Rebuild when source code changes (detected by hash)
    source_hash = local.cpp_api_source_hash
    # Rebuild when image tag changes
    image_tag = local.image_tag
  }

  provisioner "local-exec" {
    command = <<-EOT
      set -e
      echo "Building API using cpp-api/cloudbuild.yaml with tag: ${local.image_tag}..."
      cd ${path.root}/../../cpp-api
      gcloud builds submit \
        --project=${var.project_id} \
        --config=cloudbuild.yaml \
        --substitutions=_IMAGE_NAME=${var.artifact_registry_location}-docker.pkg.dev/${var.project_id}/${var.repository_id}/cpp-api:${local.image_tag} \
        .
    EOT
  }

  depends_on = [var.depends_on_resources]
}

# Build Frontend image using Cloud Build from GitHub
resource "null_resource" "build_frontend" {
  count = var.enable_frontend_build ? 1 : 0

  triggers = {
    # Rebuild when git ref changes
    git_ref = var.git_ref
    # Rebuild when source code changes (detected by hash)
    source_hash = local.frontend_source_hash
    # Rebuild when image tag changes
    image_tag = local.image_tag
    # Rebuild when build args change
    google_maps_api_key = var.google_maps_api_key
    cpp_api_url = var.cpp_api_url
  }

   provisioner "local-exec" {
    command = <<-EOT
      set -e
      echo "Building Frontend using frontend/cloudbuild.yaml with tag: ${local.image_tag}..."
      cd ${path.root}/../../frontend
      gcloud builds submit \
        --project=${var.project_id} \
        --config=cloudbuild.yaml \
        --substitutions=_IMAGE_NAME=${var.artifact_registry_location}-docker.pkg.dev/${var.project_id}/${var.repository_id}/frontend:${local.image_tag},_VITE_GOOGLE_MAPS_API_KEY=${var.google_maps_api_key},_VITE_API_URL=${var.cpp_api_url} \
        .
    EOT
  }

  depends_on = [var.depends_on_resources]
}
