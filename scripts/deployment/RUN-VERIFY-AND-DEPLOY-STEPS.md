# Run verify and fix steps (dev)

Run these from the **repo root** with AWS access working (`aws sso login` and credentials exported).

---

## 0. "AWS credentials are invalid" / "security token is invalid"

SSO and temporary credentials expire. Refresh and export them in the **same terminal** where you run deploy/verify:

```bash
# 1) Log in (opens browser if using SSO)
aws sso login

# If you use a named profile:
# aws sso login --profile your-profile-name

# 2) Export credentials into this shell so Terraform/scripts use them
eval $(aws configure export-credentials --format env 2>/dev/null)

# 3) Optional: unset profile so the exported env vars are used
unset AWS_PROFILE

# 4) Confirm it works
aws sts get-caller-identity
```

Then run your deploy or verify command again in that same terminal.

---

## 1. Verify all stacks

```bash
./scripts/deployment/verify-dev-deployment.sh
```

- If **github-actions-oidc** shows a state lock error → do **Step 2**.
- If any stack shows **DRIFT** → fix them one by one with **Step 3**.

---

## 2. Fix github-actions-oidc (state lock)

Unlock the state (script extracts Lock ID and runs force-unlock):

```bash
./scripts/deployment/unlock-oidc.sh -e dev
```

If the script can’t parse the Lock ID, run plan manually and copy the ID from the error, then:

```bash
cd backend/infra/terraform2/stacks/github-actions-oidc
terraform force-unlock -force <LOCK_ID>
cd ../../../../..
```

---

## 3. Fix drift stack by stack

Apply one stack at a time (order below is safe):

```bash
# 1) Unlock first if verify reported github-actions-oidc ERROR
./scripts/deployment/unlock-oidc.sh -e dev

# 2) Apply each drifting stack (run one, then re-verify if you want)
./scripts/deployment/apply-one-stack.sh -e dev security
# If ECR fails with "RepositoryNotEmptyException", run the one-time state rm below first:
./scripts/deployment/apply-one-stack.sh -e dev ecr
./scripts/deployment/apply-one-stack.sh -e dev authorizer
./scripts/deployment/apply-one-stack.sh -e dev appsync
./scripts/deployment/apply-one-stack.sh -e dev apigateway
```

---

## 4. ECR: "Repository not empty, consider using force_delete"

If ECR apply fails because it tries to delete repos that already have images, **ignore** those repos (treat them as existing): remove them from state once so Terraform uses the data source instead and does not destroy anything.

From repo root (after `cd backend/infra/terraform2/stacks/ecr` run `terraform init` with your backend, then):

```bash
cd backend/infra/terraform2/stacks/ecr
# One-time: stop managing these repos in this stack (they stay in AWS; we use data source)
terraform state rm 'aws_ecr_repository.services["goalsguild_subscription_service"]'
terraform state rm 'aws_ecr_repository.services["goalsguild_gamification_service"]'
# If other repos fail with the same error, run: terraform state rm 'aws_ecr_repository.services["<repo_name>"]'
cd ../../../../..
```

Then run ECR apply again: `./scripts/deployment/apply-one-stack.sh -e dev ecr`

---

## 5. Messaging and subscription service (Lambda + image)

`dev.tfvars` sets `subscription_image_uri` and `messaging_image_uri` so that a normal apply creates/updates the Lambdas. **The ECR image must exist** (same tag as in tfvars, e.g. `:v1`).

If the image does not exist yet, build and push once, then apply:

```bash
# From repo root (with AWS and Docker available)
cd backend/infra/terraform2/scripts
./deploy-subscription-service-with-build.sh -e dev
./deploy-messaging-service-with-build.sh -e dev
cd ../../..
```

Then `./scripts/deployment/apply-one-stack.sh -e dev subscription-service` and `... messaging-service` (or deploy-all) will keep the Lambdas in sync. Update the tag in `backend/infra/terraform2/environments/dev.tfvars` if you use a different image tag.

---

After fixing drift, run verify again:

```bash
./scripts/deployment/verify-dev-deployment.sh
```

**Optional:** apply all drift in one go:

```bash
./scripts/deployment/deploy-all-except-waf.sh -e dev
```
