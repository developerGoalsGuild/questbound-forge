from __future__ import annotations
import boto3
from botocore.exceptions import ClientError
from .ssm import settings


_sesv2 = boto3.client("sesv2")




def send_email(to: str, subject: str, html: str, text: str | None = None) -> None:
    """Send an email via SES v2. Raises ClientError on failure."""
    text = text or "This message requires an HTML-capable client."
    _sesv2.send_email(
    FromEmailAddress=settings.ses_sender_email,
    Destination={"ToAddresses": [to]},
    Content={
            "Simple": {
            "Subject": {"Data": subject, "Charset": "UTF-8"},
            "Body": {
                "Text": {"Data": text, "Charset": "UTF-8"},
                "Html": {"Data": html, "Charset": "UTF-8"},
            },
        }
        },
    )