output "id" {
  description = "The ID of the Redis instance"
  value       = google_redis_instance.cache.id
}

output "host" {
  description = "The IP address of the Redis instance"
  value       = google_redis_instance.cache.host
}

output "port" {
  description = "The port number of the Redis instance"
  value       = google_redis_instance.cache.port
}

output "connection_string" {
  description = "Redis connection string"
  value       = "${google_redis_instance.cache.host}:${google_redis_instance.cache.port}"
}

output "auth_string" {
  description = "AUTH string for the Redis instance"
  value       = google_redis_instance.cache.auth_string
  sensitive   = true
}
