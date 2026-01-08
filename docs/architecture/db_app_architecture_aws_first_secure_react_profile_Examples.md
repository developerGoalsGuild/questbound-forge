# Additions: `createUser` Resolver and Draw\.io Architecture Diagram

---

## 21) AppSync JavaScript Resolver — `createUser`

```javascript
// file: resolvers/createUser.js
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});
const TABLE = process.env.TABLE;

export const request = async (ctx) => {
  const { nickname, language, pronouns, bio, tags } = ctx.args.input;
  const sub = ctx.identity.sub;
  const now = Date.now();
  const userId = sub || uuidv4();

  const item = {
    PK: { S: `USER#${userId}` },
    SK: { S: `PROFILE#${userId}` },
    type: { S: "User" },
    id: { S: userId },
    nickname: { S: nickname || "" },
    language: { S: language || "en" },
    pronouns: { S: pronouns || "" },
    bio: { S: bio || "" },
    tags: { SS: tags || [] },
    tier: { S: "free" },
    createdAt: { N: String(now) },
    updatedAt: { N: String(now) },
  };

  await client.send(new PutItemCommand({ TableName: TABLE, Item: item }));
  return {
    id: userId,
    nickname,
    language,
    pronouns,
    bio,
    tags,
    tier: "free",
  };
};

export const response = async (ctx) => ctx.result;
```

---

## 22) AppSync Resolvers — Other Examples

- ``: Write `GOAL#<goalId>` under `PK=USER#<userId>`.
- ``: Write `TASK#<taskId>` under `PK=GOAL#<goalId>` and duplicate to `USER#<userId>` partition for due queries.
- ``: Append to `ROOM#<roomId>` with SK = `MSG#<ts>#<id>`.
- ``** Subscription**: Triggered by publish from resolver after write.

---

## 23) Stripe Webhook Lambda — Subscription State

```python
# file: billing/stripe_webhook.py
import json, os, stripe, boto3

stripe.api_key = os.environ["STRIPE_SECRET"]
ddb = boto3.resource("dynamodb")
tbl = ddb.Table(os.environ["TABLE"])

def handler(event, ctx):
    payload = event["body"]
    sig_header = event["headers"].get("Stripe-Signature")
    endpoint_secret = os.environ["STRIPE_WEBHOOK_SECRET"]

    try:
        evt = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except Exception as e:
        return {"statusCode": 400, "body": str(e)}

    if evt["type"] in ["checkout.session.completed", "customer.subscription.updated", "customer.subscription.deleted"]:
        sub = evt["data"]["object"]
        user_id = sub.get("metadata", {}).get("userId")
        if user_id:
            tbl.put_item(Item={
                "PK": f"USER#{user_id}",
                "SK": f"SUB#{sub['id']}",
                "type": "Subscription",
                "state": sub["status"],
                "renewAt": int(sub.get("current_period_end", 0)),
                "planId": sub.get("plan", {}).get("id", ""),
                "updatedAt": int(__import__("time").time()),
            })
    return {"statusCode": 200, "body": "ok"}
```

---

## 24) Draw\.io Architecture Diagram (AWS Icons)

Below is the **draw\.io XML** you can import directly into [draw.io/diagrams.net](https://app.diagrams.net). It uses AWS official icons to represent the architecture:

```xml
<mxfile host="app.diagrams.net">
  <diagram id="aws-arch" name="AWS Serverless Architecture">
    <mxGraphModel dx="1182" dy="713" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1200" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="2" value="React Web/Mobile Client" style="shape=image;image=img/lib/mscae/WebClient.svg" vertex="1" parent="1">
          <mxGeometry x="40" y="80" width="80" height="80" as="geometry" />
        </mxCell>
        <mxCell id="3" value="Amazon Cognito" style="shape=image;image=img/lib/aws3/cognito.svg" vertex="1" parent="1">
          <mxGeometry x="180" y="80" width="80" height="80" as="geometry" />
        </mxCell>
        <mxCell id="4" value="API Gateway / AppSync" style="shape=image;image=img/lib/aws3/apigateway.svg" vertex="1" parent="1">
          <mxGeometry x="340" y="80" width="80" height="80" as="geometry" />
        </mxCell>
        <mxCell id="5" value="Lambda Authorizer" style="shape=image;image=img/lib/aws3/lambda.svg" vertex="1" parent="1">
          <mxGeometry x="500" y="80" width="80" height="80" as="geometry" />
        </mxCell>
        <mxCell id="6" value="AWS Lambda (Resolvers)" style="shape=image;image=img/lib/aws3/lambda.svg" vertex="1" parent="1">
          <mxGeometry x="660" y="80" width="80" height="80" as="geometry" />
        </mxCell>
        <mxCell id="7" value="DynamoDB (Single Table)" style="shape=image;image=img/lib/aws3/dynamodb.svg" vertex="1" parent="1">
          <mxGeometry x="820" y="80" width="80" height="80" as="geometry" />
        </mxCell>
        <mxCell id="8" value="EventBridge / SQS" style="shape=image;image=img/lib/aws3/sqs.svg" vertex="1" parent="1">
          <mxGeometry x="980" y="80" width="80" height="80" as="geometry" />
        </mxCell>
        <mxCell id="9" value="OpenSearch Serverless" style="shape=image;image=img/lib/aws3/opensearch.svg" vertex="1" parent="1">
          <mxGeometry x="1140" y="80" width="80" height="80" as="geometry" />
        </mxCell>
        <mxCell id="10" value="Stripe (External)" style="shape=image;image=img/lib/mscae/Payment.svg" vertex="1" parent="1">
          <mxGeometry x="1300" y="80" width="80" height="80" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

Import this into **draw\.io** (File → Import → From… → XML) to visualize and extend. The icons represent client, Cognito, AppSync/API Gateway, Lambda authorizer, business Lambdas, DynamoDB, EventBridge/SQS, OpenSearch, and external Stripe.

---

✅ You now have: `createUser` resolver, example subscription/payment integrations, plus a ready‑to‑import **draw\.io AWS architecture diagram**.

