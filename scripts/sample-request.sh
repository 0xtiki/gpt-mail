curl -X POST http://localhost:3000/inbox -H "Content-Type: application/json" -d '{
  "domain": "example.com",
  "recipient": "recipient@example.com",
  "sender": "sender@example.com",
  "from": "Alice <alice@example.com>",
  "subject": "Test Subject",
  "body-plain": "This is the plain text version of the email.",
  "stripped-text": "This is the stripped text version without quotes and signature.",
  "stripped-signature": "This is the stripped signature.",
  "body-html": "<html><body>This is the HTML version of the email.</body></html>",
  "stripped-html": "<html><body>This is the stripped HTML version of the email without quotes.</body></html>",
  "attachments": "[{\"filename\":\"attachment.txt\",\"content-type\":\"text/plain\",\"size\":12345}]",
  "message-url": "http://example.com/message/12345",
  "timestamp": 1622470421,
  "token": "abcdefghijklmnopqrstuvwxyz1234567890ABCDE",
  "signature": "d41d8cd98f00b204e9800998ecf8427e",
  "message-headers": "{\"Received\":[\"from mail.example.com (mail.example.com [192.0.2.1]) by smtp.example.com with ESMTP id abc123\"],\"Subject\":\"Test Subject\"}",
  "Content-id-map": "{}"
}'