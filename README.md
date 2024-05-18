
# GPT Mail    

## About

Proof of concept for GPT email integration. The app consists of two micro services, gpt-mail and client. The client is just a helper to use gpt-mail microservice. To run:

```
yarn
nest build gpt-mail
nest build client
```
In one terminal start gpt-mail:
```
nest start gpt-mail
```

In another terminal start the client:
```
nest start client
```
Got to localhost:3000/hello/<TYPE-SOME-MESSAGE-HERE>

You will receive an email with Chad's response to your message.

## Env
`GPT_MAIL_SERVICE_HOST`='0.0.0.0' - gpt-mail microservice host ip       
`GPT_MAIL_SERVICE_PORT`=8080 - gpt-mail microservice port       
`OPENAI_API_KEY`      
`MAILGUN_API_KEY`       
`MAILGUN_SENDING_DOMAIN` domain registered in mailgun     
`RECEIPIENT_EMAIL` who you're sending gpt response to     