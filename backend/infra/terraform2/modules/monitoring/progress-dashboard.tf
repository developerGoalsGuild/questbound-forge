# CloudWatch Dashboard for Goal Progress Monitoring
# Provides comprehensive monitoring for progress calculation performance,
# error rates, and user engagement metrics

resource "aws_cloudwatch_dashboard" "goal_progress_dashboard" {
  dashboard_name = "GoalsGuild-Progress-Monitoring-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      # Header widget
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 2
        properties = {
          markdown = "# GoalsGuild Progress Monitoring Dashboard\n\nReal-time monitoring of goal progress calculation performance, error rates, and user engagement metrics.\n\n**Environment:** ${var.environment} | **Last Updated:** ${timestamp()}"
        }
      },

      # Progress Calculation Performance Metrics
      {
        type   = "metric"
        x      = 0
        y      = 2
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", var.quest_service_function_name, { "stat" = "Average" }],
            [".", ".", ".", ".", { "stat" = "p95" }],
            [".", ".", ".", ".", { "stat" = "p99" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Progress Calculation Response Time"
          period  = 300
          yAxis = {
            left = {
              min = 0
              max = 5000
            }
          }
          annotations = {
            horizontal = [
              {
                label = "Target < 200ms"
                value = 200
              },
              {
                label = "Warning > 500ms"
                value = 500
              }
            ]
          }
        }
      },

      # Error Rate Monitoring
      {
        type   = "metric"
        x      = 12
        y      = 2
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", var.quest_service_function_name, { "stat" = "Sum" }],
            [".", "Invocations", ".", ".", { "stat" = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Progress Calculation Error Rate"
          period  = 300
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },

      # Progress API Endpoint Usage
      {
        type   = "metric"
        x      = 0
        y      = 8
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", var.api_gateway_name, "Method", "GET", "Resource", "/quests/progress"],
            [".", ".", ".", ".", ".", ".", ".", "/quests/{goal_id}/progress"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Progress API Endpoint Usage"
          period  = 300
        }
      },

      # API Gateway Response Times
      {
        type   = "metric"
        x      = 8
        y      = 8
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiName", var.api_gateway_name, "Method", "GET", "Resource", "/quests/progress", { "stat" = "Average" }],
            [".", ".", ".", ".", ".", ".", ".", "/quests/{goal_id}/progress", { "stat" = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Response Times"
          period  = 300
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },

      # HTTP Status Code Distribution
      {
        type   = "metric"
        x      = 16
        y      = 8
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "4XXError", "ApiName", var.api_gateway_name],
            [".", "5XXError", ".", "."],
            [".", "Count", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "HTTP Status Code Distribution"
          period  = 300
        }
      },

      # DynamoDB Performance for Progress Queries
      {
        type   = "metric"
        x      = 0
        y      = 14
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/DynamoDB", "SuccessfulRequestLatency", "TableName", var.dynamodb_table_name, "Operation", "Query", { "stat" = "Average" }],
            [".", ".", ".", ".", ".", ".", { "stat" = "p95" }],
            [".", "ConsumedReadCapacityUnits", ".", ".", { "stat" = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DynamoDB Progress Query Performance"
          period  = 300
        }
      },

      # AppSync GraphQL Metrics
      {
        type   = "metric"
        x      = 12
        y      = 14
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/AppSync", "Latency", "GraphQLAPIId", var.appsync_api_id, "FieldName", "goalProgress", { "stat" = "Average" }],
            [".", ".", ".", ".", ".", "myGoalsProgress", { "stat" = "Average" }],
            [".", ".", ".", ".", ".", "myGoalsWithTasks", { "stat" = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "AppSync GraphQL Progress Query Latency"
          period  = 300
        }
      },

      # Custom Progress Calculation Metrics
      {
        type   = "metric"
        x      = 0
        y      = 20
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["GoalsGuild/Progress", "CalculationSuccess", "Environment", var.environment],
            [".", "CalculationFailure", ".", "."],
            [".", "MilestoneAchieved", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Progress Calculation Events"
          period  = 300
        }
      },

      # Progress Distribution Analysis
      {
        type   = "metric"
        x      = 8
        y      = 20
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["GoalsGuild/Progress", "ProgressRange_0_25", "Environment", var.environment],
            [".", "ProgressRange_25_50", ".", "."],
            [".", "ProgressRange_50_75", ".", "."],
            [".", "ProgressRange_75_100", ".", "."]
          ]
          view    = "timeSeries"
          stacked = true
          region  = var.aws_region
          title   = "Progress Distribution by Range"
          period  = 300
        }
      },

      # User Engagement with Progress Features
      {
        type   = "metric"
        x      = 16
        y      = 20
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["GoalsGuild/Progress", "DashboardViews", "Environment", var.environment],
            [".", "GoalDetailsViews", ".", "."],
            [".", "ProgressBarInteractions", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Progress Feature Engagement"
          period  = 300
        }
      },

      # Log Insights Widget for Error Analysis
      {
        type   = "log"
        x      = 0
        y      = 26
        width  = 24
        height = 6
        properties = {
          query   = "SOURCE '/aws/lambda/${var.quest_service_function_name}'\n| fields @timestamp, @message\n| filter @message like /progress\\.calculation_failed/\n| sort @timestamp desc\n| limit 100"
          region  = var.aws_region
          title   = "Recent Progress Calculation Errors"
          view    = "table"
        }
      },

      # Performance Summary Table
      {
        type   = "metric"
        x      = 0
        y      = 32
        width  = 12
        height = 4
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", var.quest_service_function_name, { "stat" = "Average" }],
            ["AWS/ApiGateway", "Latency", "ApiName", var.api_gateway_name, { "stat" = "Average" }],
            ["AWS/DynamoDB", "SuccessfulRequestLatency", "TableName", var.dynamodb_table_name, { "stat" = "Average" }]
          ]
          view    = "singleValue"
          region  = var.aws_region
          title   = "Current Performance Summary"
          period  = 300
        }
      },

      # Availability and Success Rate
      {
        type   = "metric"
        x      = 12
        y      = 32
        width  = 12
        height = 4
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", var.quest_service_function_name, { "stat" = "Sum" }],
            [".", "Invocations", ".", ".", { "stat" = "Sum" }]
          ]
          view    = "singleValue"
          region  = var.aws_region
          title   = "Success Rate (Last Hour)"
          period  = 3600
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Service     = "GoalsGuild"
    Component   = "Progress"
    Purpose     = "Monitoring"
  }
}

# CloudWatch Alarms for Progress Monitoring
resource "aws_cloudwatch_metric_alarm" "progress_calculation_high_latency" {
  alarm_name          = "goalsguild-${var.environment}-progress-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "500"
  alarm_description   = "This metric monitors progress calculation latency"
  alarm_actions       = [var.sns_alert_topic_arn]
  ok_actions          = [var.sns_alert_topic_arn]

  dimensions = {
    FunctionName = var.quest_service_function_name
  }

  tags = {
    Environment = var.environment
    Service     = "GoalsGuild"
    Component   = "Progress"
  }
}

resource "aws_cloudwatch_metric_alarm" "progress_calculation_error_rate" {
  alarm_name          = "goalsguild-${var.environment}-progress-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors progress calculation error rate"
  alarm_actions       = [var.sns_alert_topic_arn]
  ok_actions          = [var.sns_alert_topic_arn]

  dimensions = {
    FunctionName = var.quest_service_function_name
  }

  tags = {
    Environment = var.environment
    Service     = "GoalsGuild"
    Component   = "Progress"
  }
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_progress_4xx_errors" {
  alarm_name          = "goalsguild-${var.environment}-progress-api-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "20"
  alarm_description   = "This metric monitors 4XX errors on progress API endpoints"
  alarm_actions       = [var.sns_alert_topic_arn]

  dimensions = {
    ApiName = var.api_gateway_name
  }

  tags = {
    Environment = var.environment
    Service     = "GoalsGuild"
    Component   = "Progress"
  }
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_progress_throttling" {
  alarm_name          = "goalsguild-${var.environment}-progress-db-throttling"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DynamoDB throttling for progress queries"
  alarm_actions       = [var.sns_alert_topic_arn]

  dimensions = {
    TableName = var.dynamodb_table_name
  }

  tags = {
    Environment = var.environment
    Service     = "GoalsGuild"
    Component   = "Progress"
  }
}

# Custom CloudWatch Log Group for Progress Metrics
resource "aws_cloudwatch_log_group" "progress_metrics" {
  name              = "/goalsguild/${var.environment}/progress-metrics"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Service     = "GoalsGuild"
    Component   = "Progress"
  }
}

# CloudWatch Log Metric Filters for Custom Metrics
resource "aws_cloudwatch_log_metric_filter" "progress_calculation_success" {
  name           = "progress-calculation-success"
  log_group_name = "/aws/lambda/${var.quest_service_function_name}"
  pattern        = "[timestamp, request_id, level=\"INFO\", event=\"progress.calculated\", ...]"

  metric_transformation {
    name      = "CalculationSuccess"
    namespace = "GoalsGuild/Progress"
    value     = "1"
    default_value = "0"

    dimensions = {
      Environment = var.environment
    }
  }
}

resource "aws_cloudwatch_log_metric_filter" "progress_calculation_failure" {
  name           = "progress-calculation-failure"
  log_group_name = "/aws/lambda/${var.quest_service_function_name}"
  pattern        = "[timestamp, request_id, level=\"ERROR\", event=\"progress.calculation_failed\", ...]"

  metric_transformation {
    name      = "CalculationFailure"
    namespace = "GoalsGuild/Progress"
    value     = "1"
    default_value = "0"

    dimensions = {
      Environment = var.environment
    }
  }
}

resource "aws_cloudwatch_log_metric_filter" "milestone_achieved" {
  name           = "milestone-achieved"
  log_group_name = "/aws/lambda/${var.quest_service_function_name}"
  pattern        = "[timestamp, request_id, level=\"INFO\", event=\"milestone.achieved\", ...]"

  metric_transformation {
    name      = "MilestoneAchieved"
    namespace = "GoalsGuild/Progress"
    value     = "1"
    default_value = "0"

    dimensions = {
      Environment = var.environment
    }
  }
}

# Output dashboard URL
output "progress_dashboard_url" {
  description = "URL to the CloudWatch dashboard for progress monitoring"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.goal_progress_dashboard.dashboard_name}"
}
