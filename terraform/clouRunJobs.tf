terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "5.33.0"
    }
  }
  backend "gcs" {
   bucket  = "gpt-mail-terraform-state"
   prefix  = "terraform/state"
 }
}

provider "google" {
  project = local.envs["GCP_PROJECT_ID"]
  region  = local.envs["GCP_REGION"]
}

# storage bucket to save TF state
resource "google_storage_bucket" "default" {
  name          = "gpt-mail-terraform-state"
  force_destroy = false
  location      = local.envs["GCP_REGION"]
  storage_class = "STANDARD"
  versioning {
    enabled = false
  }
}

resource "google_cloud_run_v2_job" "core_job" {
  name     = "gpt-mail-core"
  location = local.envs["GCP_REGION"]
  launch_stage = "BETA"
  template {
    task_count = local.envs["GCP_CLOUD_RUN_TASK_COUNT"]
    labels = tomap({"core-job": "cloud-run-job"})
    template {
      timeout = local.envs["GCP_CLOUD_RUN_TIMEOUT"]
      max_retries = local.envs["GCP_CLOUD_RUN_MAX_RETRIES"]
      containers {
        name = "core"
        image = "${local.envs["GCP_REGION"]}-docker.pkg.dev/${local.envs["GCP_PROJECT_ID"]}/gpt-mail-docker-repo/gpt-mail-core-image:v0.0.1"
        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
        dynamic "env" {
          for_each = local.envs
          content {
            name  = env.key
            value = env.value
          }
        }
      }
    }
  }
}

resource "google_cloud_run_v2_job" "gpt_job" {
  name     = "gpt-mail-gpt"
  location = local.envs["GCP_REGION"]
  launch_stage = "BETA"
  template {
    task_count = local.envs["GCP_CLOUD_RUN_TASK_COUNT"]
    labels = tomap({"gpt-job": "cloud-run-job"})
    template {
      timeout = local.envs["GCP_CLOUD_RUN_TIMEOUT"]
      max_retries = 0
      containers {
        name = "core"
        image = "${local.envs["GCP_REGION"]}-docker.pkg.dev/${local.envs["GCP_PROJECT_ID"]}/gpt-mail-docker-repo/gpt-mail-gpt-image:v0.0.1"
        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
        dynamic "env" {
          for_each = local.envs
          content {
            name  = env.key
            value = env.value
          }
        }
      }
    }
  }
}

resource "google_cloud_run_v2_job" "outbox_job" {
  name     = "gpt-mail-outbox"
  location = local.envs["GCP_REGION"]
  launch_stage = "BETA"
  template {
    task_count = local.envs["GCP_CLOUD_RUN_TASK_COUNT"]
    labels = tomap({"outbox-job": "cloud-run-job"})
    template {
      timeout = local.envs["GCP_CLOUD_RUN_TIMEOUT"]
      max_retries = local.envs["GCP_CLOUD_RUN_MAX_RETRIES"]
      containers {
        name = "outbox"
        image = "${local.envs["GCP_REGION"]}-docker.pkg.dev/${local.envs["GCP_PROJECT_ID"]}/gpt-mail-docker-repo/gpt-mail-outbox-image:v0.0.1"
        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
        dynamic "env" {
          for_each = local.envs
          content {
            name  = env.key
            value = env.value
          }
        }
      }
    }
  }
}

resource "google_cloud_scheduler_job" "core_schedule" {
  name             = "core_schedule"
  description      = "run core cloudrun job"
  schedule         = local.envs["GCP_CLOUD_RUN_SCHEDULE"]
  time_zone        = "America/New_York"
  # attempt_deadline = "320s"

  retry_config {
    retry_count = 0
  }

  http_target {
    http_method = "POST"
    uri         = "https://${local.envs["GCP_REGION"]}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${local.envs["GCP_PROJECT_ID"]}/jobs/gpt-mail-core:run"
    # body        = base64encode("{\"foo\":\"bar\"}")
    # headers = {
    #   "Content-Type" = "application/json"
    # }
    oauth_token {
      service_account_email = "761864899259-compute@developer.gserviceaccount.com"
    }
  }
}

resource "google_cloud_scheduler_job" "gpt_schedule" {
  name             = "gpt_schedule"
  description      = "run gpt cloudrun job"
  schedule         = local.envs["GCP_CLOUD_RUN_SCHEDULE"]
  time_zone        = "America/New_York"
  # attempt_deadline = "320s"

  retry_config {
    retry_count = 0
  }

  http_target {
    http_method = "POST"
    uri         = "https://${local.envs["GCP_REGION"]}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${local.envs["GCP_PROJECT_ID"]}/jobs/gpt-mail-gpt:run"
    # body        = base64encode("{\"foo\":\"bar\"}")
    # headers = {
    #   "Content-Type" = "application/json"
    # }
    oauth_token {
      service_account_email = "761864899259-compute@developer.gserviceaccount.com"
    }
  }
}

resource "google_cloud_scheduler_job" "outbox_schedule" {
  name             = "outbox_schedule"
  description      = "run outbox cloudrun job"
  schedule         = local.envs["GCP_CLOUD_RUN_SCHEDULE"]
  time_zone        = "America/New_York"
  attempt_deadline = "320s"

  retry_config {
    retry_count = 0
  }

  http_target {
    http_method = "POST"
    uri         = "https://${local.envs["GCP_REGION"]}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${local.envs["GCP_PROJECT_ID"]}/jobs/gpt-mail-outbox:run"
    # body        = base64encode("{\"foo\":\"bar\"}")
    # headers = {
    #   "Content-Type" = "application/json"
    # }
    oauth_token {
      service_account_email = "761864899259-compute@developer.gserviceaccount.com"
    }
  }
}