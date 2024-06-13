variable "GCP_PROJECT_ID" {
  description = "Google Cloud Platform Project ID"
  default     = ""
}
variable "NODE_ENV" {
  description = "Nodejs environment"
  default     = ""
}
variable "OPENAI_API_KEY" {
  description = "OpenAI API Key"
  default     = ""
}
variable "MAILGUN_API_KEY" {
  description = "Mailgun API Key"
  default     = ""
}
variable "MAILGUN_SENDING_DOMAIN" {
  description = "Mailgun Sending Domain"
  default     = ""
}
variable "MAILGUN_SIGNING_KEY" {
  description = "Mailgun Signing Key"
  default     = ""
}
variable "OUTBOX_EMAIL_USERNAME" {
  description = "Outbox Email Username"
  default     = ""
}
variable "OUTBOX_EMAIL_TITLE" {
  description = "Outbox Email Title"
  default     = ""
}
variable "GPT_MAIL_ASSISTANT_USERNAME" {
  description = "GPT Mail Assistant Username"
  default     = ""
}
variable "CLOUDAMQP_URL" {
  description = "CloudAMQP URL"
  default     = ""
}
variable "AMQP_CORE_INBOX_QUEUE" {
  description = "AMQP Core Inbox Queue"
  default     = ""
}
variable "AMQP_GPT_QUEUE" {
  description = "AMQP GPT Queue"
  default     = ""
}
variable "AMQP_OUTBOX_QUEUE" {
  description = "AMQP Outbox Queue"
  default     = ""
}
variable "EMAIL_WHITELIST" {
  description = "Email Whitelist"
  default     = ""
}
variable "TRANSPORT" {
  description = "Transport"
  default     = ""
}
variable "GCP_REGION" {
  description = "Google Cloud Platform Region"
  default     = ""
}
variable "GCP_ZONE" {
  description = "Google Cloud Platform Zone"
  default     = ""
}
variable "GCP_CORE_SUBSCRIPTION" {
  description = "Google Cloud Platform Core Subscription"
  default     = ""
}
variable "GCP_GPT_SUBSCRIPTION" {
  description = "Google Cloud Platform GPT Subscription"
  default     = ""
}
variable "GCP_OUTBOX_SUBSCRIPTION" {
  description = "Google Cloud Platform Outbox Subscription"
  default     = ""
}
variable "GCP_CORE_TOPIC" {
  description = "Google Cloud Platform Core Topic"
  default     = ""
}
variable "GCP_GPT_TOPIC" {
  description = "Google Cloud Platform GPT Topic"
  default     = ""
}
variable "GCP_OUTBOX_TOPIC" {
  description = "Google Cloud Platform Outbox Topic"
  default     = ""
}
variable "GCP_REPLY_TOPIC" {
  description = "Google Cloud Platform Reply Topic"
  default     = ""
}
variable "GCP_REPLY_SUBSCRIPTION" {
  description = "Google Cloud Platform Reply Subscription"
  default     = ""
}
variable "LOKI_URL" {
  description = "Loki URL"
  default     = ""
}
variable "LOKI_USERNAME" {
  description = "Loki Username"
  default     = ""
}
variable "LOKI_PASSWORD" {
  description = "Loki Password"
  default     = ""
}

variable "GCP_CLOUD_RUN_TIMEOUT" {
  description = "Cloud run job timeuot in s"
  default     = "60s"
}

variable "GCP_CLOUD_RUN_MAX_RETRIES" {
  description = "Cloud run retries"
  default     = 0
}

variable "GCP_CLOUD_RUN_SCHEDULE" {
  description = "Schedule of cloudrun jobs"
  default     = "5,35 * * * *"
}

variable "GCP_CLOUD_RUN_TASK_COUNT" {
  description = "Tasks / instaces of the cloud run job"
  default     = 1
}

variable "PROD" {
  description = "If set to true, env variables will be read from 'production' map local (defined below). Otherwise they will be read from .env.prod file"
  type        = bool
  default     = false
}

locals {
  prod = [
    ["GCP_PROJECT_ID", var.GCP_PROJECT_ID],
    ["NODE_ENV", var.NODE_ENV],
    ["OPENAI_API_KEY", var.OPENAI_API_KEY],
    ["MAILGUN_API_KEY", var.MAILGUN_API_KEY],
    ["MAILGUN_SENDING_DOMAIN", var.MAILGUN_SENDING_DOMAIN],
    ["MAILGUN_SIGNING_KEY", var.MAILGUN_SIGNING_KEY],
    ["OUTBOX_EMAIL_USERNAME", var.OUTBOX_EMAIL_USERNAME],
    ["OUTBOX_EMAIL_TITLE", var.OUTBOX_EMAIL_TITLE],
    ["GPT_MAIL_ASSISTANT_USERNAME", var.GPT_MAIL_ASSISTANT_USERNAME],
    ["CLOUDAMQP_URL", var.CLOUDAMQP_URL],
    ["AMQP_CORE_INBOX_QUEUE", var.AMQP_CORE_INBOX_QUEUE],
    ["AMQP_GPT_QUEUE", var.AMQP_GPT_QUEUE],
    ["AMQP_OUTBOX_QUEUE", var.AMQP_OUTBOX_QUEUE],
    ["EMAIL_WHITELIST", var.EMAIL_WHITELIST],
    ["TRANSPORT", var.TRANSPORT],
    ["GCP_REGION", var.GCP_REGION],
    ["GCP_ZONE", var.GCP_ZONE],
    ["GCP_CORE_SUBSCRIPTION", var.GCP_CORE_SUBSCRIPTION],
    ["GCP_GPT_SUBSCRIPTION", var.GCP_GPT_SUBSCRIPTION],
    ["GCP_OUTBOX_SUBSCRIPTION", var.GCP_OUTBOX_SUBSCRIPTION],
    ["GCP_CORE_TOPIC", var.GCP_CORE_TOPIC],
    ["GCP_GPT_TOPIC", var.GCP_GPT_TOPIC],
    ["GCP_OUTBOX_TOPIC", var.GCP_OUTBOX_TOPIC],
    ["GCP_REPLY_TOPIC", var.GCP_REPLY_TOPIC],
    ["GCP_REPLY_SUBSCRIPTION", var.GCP_REPLY_SUBSCRIPTION],
    ["LOKI_URL", var.LOKI_URL],
    ["LOKI_USERNAME", var.LOKI_USERNAME],
    ["LOKI_PASSWORD", var.LOKI_PASSWORD],
    ["GCP_CLOUD_RUN_TIMEOUT", var.GCP_CLOUD_RUN_TIMEOUT],
    ["GCP_CLOUD_RUN_MAX_RETRIES", var.GCP_CLOUD_RUN_MAX_RETRIES],
    ["GCP_CLOUD_RUN_SCHEDULE", var.GCP_CLOUD_RUN_SCHEDULE],
    ["GCP_CLOUD_RUN_TASK_COUNT", var.GCP_CLOUD_RUN_TASK_COUNT],
  ]
  dev = [for line in split("\n", file("../.env.terraform")) : regexall("([^=]+)=(.*)", line)[0]]
  envs = {
    for tuple in (var.PROD ? local.prod : local.dev) : tuple[0] => tuple[1]
  }
}

