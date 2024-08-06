# Amplify Configuration Snippets

No particular order but adding items here to codify aspects of AWS Amplify configurations for FE.

## Amplify Notifications

_Inspiration: https://dev.to/mubbashir10/enable-slack-notifications-for-aws-amplify-deployments-5a0l_

Github Actions triggers a build job manually for UAT/PRODUCTION environments. Once Amplify has completed the build, a notification is routed back to Slack.

### Setup Instructions

For Amplify Notifications -

1. Activate Build Notifications for the respective Amplify App, under `General Settings`. This requires an e-mail notification, use `tech@ithacanoemon.tech` as default choice.
2. E-Mail confirmation and then AWS creates an SNS topic.
3. Create a new AWS Lambda function: `slack-notification-messenger` with the following codebase:

```js
// # index.mjs
// deps in lambda are added as layers
import fetch from "node-fetch";

// this should be your webhook URL (doc: https://api.slack.com/messaging/webhooks)
const webhookURL = "https://hooks.slack.com/services/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";

export const handler = async event => {
  const message = event.Records[0].Sns.Message;

  return await fetch(webhookURL, {
    method: "POST",
    body: JSON.stringify({
      attachments: [
        {
          title: `*[PRODUCTION]* Deployment Acknowledgement: AWS Amplify Frontend`,
          text: message,
        },
      ],
    }),
    headers: { "Content-Type": "application/json" },
  })
    .then(data => console.log("sent!"))
    .catch(e => console.error(e.response.data));
};
```

4. Under the _TEST_ tab, you should create a new Test Event: `Test Notification Event` with the following EVENT JSON:

```json
{
  "Records": [
    {
      "Sns": {
        "Message": "This is a test notification from AWS Lambda"
      }
    }
  ]
}
```

5. Generate and upload the `node-fetch-layer` (stored here) as a base layer in order to support `import fetch from 'node-fetch'`

#### node-fetch-layer

_Original Inspo:_

- https://aws.amazon.com/blogs/compute/optimizing-serverless-development-with-samconfig/

Used as a part of a manually-generated AWS Lambda base layer in order to trigger Slack notifications from AWS Amplify builds.

```bash
EXPORT AWS_PROFILE=ithacanoemon-<AWS ACCOUNT>
aws sso login

sam build
sam deploy
```

7. In Lambda, add trigger for SNS - specify the SNS topic created by Amplify earlier

8. You **cannot** do this in AWS Amplify, but must go to AWS SNS topic in order to remove the _original_ e-mail notification. We don't want it anymore because we have the Slack Build Notifications. Go to the listed topic and delete the e-mail subscription.

The SNS topic default naming convention is `amplify-${AWS_AMPLIFY_APP_ID}_${BRANCH_NAME}`.
