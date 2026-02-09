# Terraform S3 Backend Config

Terraform state is stored in S3, with **one bucket per environment**:

| Environment | Bucket                      | DynamoDB lock table              |
|-------------|-----------------------------|----------------------------------|
| dev         | `tfstate-goalsguild-dev`     | `tfstate-goalsguild-dev-lock`    |
| staging     | `tfstate-goalsguild-staging` | `tfstate-goalsguild-staging-lock` |
| prod        | `tfstate-goalsguild-prod`    | `tfstate-goalsguild-prod-lock`   |

States in each bucket are stored in **folders** (S3 key prefixes):

- **`apps/frontend/`** – frontend Terraform state  
- **`apps/landing-page/`** – landing page state  
- **`backend/database/`**, **`backend/ecr/`**, **`backend/s3/`**, **`backend/security/`**, **`backend/ses/`**, **`backend/authorizer/`**, **`backend/apigateway/`**, **`backend/appsync/`**, **`backend/github-actions-oidc/`** – infra stacks  
- **`backend/services/user-service/`**, **`backend/services/quest-service/`**, etc. – service stacks  

## One-time setup (per environment)

Create the S3 bucket and DynamoDB table for state and locking (run once per environment, e.g. for dev):

```bash
# Create S3 bucket (replace REGION if needed)
aws s3api create-bucket --bucket tfstate-goalsguild-dev --region us-east-2

# Enable versioning (recommended for state)
aws s3api put-bucket-versioning --bucket tfstate-goalsguild-dev \
  --versioning-configuration Status=Enabled

# Optional: enable encryption
aws s3api put-bucket-encryption --bucket tfstate-goalsguild-dev \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Create DynamoDB table for state lock
aws dynamodb create-table --table-name tfstate-goalsguild-dev-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST --region us-east-2
```

Repeat for `tfstate-goalsguild-staging` and `tfstate-goalsguild-prod` when you use those environments.

## Initialize Terraform with S3 backend

**Always run from the repository root** (the folder that contains `apps/`, `backend/`, and `backend-config/`).

Each `backend.tf` now has **dev** bucket/region/dynamodb set by default, so `terraform init -reconfigure` (or the script) will not prompt for the bucket. For **staging** or **prod**, pass `-backend-config=.../staging.hcl` or `.../prod.hcl` to override.

### Recommended: helper script (works with AWS SSO)

From repo root, after `aws sso login`:

```bash
cd /path/to/questbound-forge
bash backend-config/tf-init-s3.sh apps/frontend/terraform
```

For other modules use the same script with the Terraform directory, e.g. `bash backend-config/tf-init-s3.sh apps/landing-page/terraform` or `bash backend-config/tf-init-s3.sh backend/infra/terraform2/stacks/database`. Re-run after each new SSO login when the session expires.

**Initialize all stacks at once** (from repo root, after `aws sso login`):

```bash
bash backend-config/tf-init-all-stacks.sh
```

### Manual init (if not using SSO)

Then run init from the Terraform module directory. The `-backend-config` path is relative to that directory.

**Apps (frontend / landing-page):**

```bash
cd apps/frontend/terraform
terraform init -reconfigure -backend-config=../../../backend-config/dev.hcl

cd ../../..
cd apps/landing-page/terraform
terraform init -reconfigure -backend-config=../../../backend-config/dev.hcl
```

**Backend infra stacks (e.g. database, ecr, security):**

```bash
cd backend/infra/terraform2/stacks/database
terraform init -backend-config=../../../../../../backend-config/dev.hcl
```

**Backend service stacks (e.g. user-service):**

```bash
cd backend/infra/terraform2/stacks/services/user-service
terraform init -backend-config=../../../../../../backend-config/dev.hcl
```

Replace `dev.hcl` with `staging.hcl` or `prod.hcl` for those environments.

## Migrate existing local state to S3

If you already have a **local** `terraform.tfstate` (or `terraform.tfstate.backup`) and want to move it to S3 so you don’t lose track of existing resources, do a one-time **migration** instead of a plain init.

1. **Back up local state** (optional but recommended):
   ```bash
   cp apps/frontend/terraform/terraform.tfstate apps/frontend/terraform/terraform.tfstate.backup.local
   ```

2. **Run the migrate script** from repo root (after `aws sso login`). When Terraform asks **“Do you want to copy existing state to the new backend?”**, type **yes** and press Enter:
   ```bash
   cd /path/to/questbound-forge
   bash backend-config/tf-migrate-state-s3.sh apps/frontend/terraform
   ```

3. Use the same pattern for other modules (e.g. `bash backend-config/tf-migrate-state-s3.sh apps/landing-page/terraform`). You only need to migrate once per module that had local state.

After migration, use the normal init script (`tf-init-s3.sh`) for that module; no need to migrate again.

### No state in S3 / state was never migrated

**If the S3 bucket has no state file**, it usually means one of:

1. **You never ran `terraform apply` for this module**  
   Then there is no state yet. Run `terraform plan` then `terraform apply` (after `bash backend-config/tf-init-s3.sh ...` and with credentials). State will be written to S3 from the first apply.

2. **You had local state but the migrate script ran after switching to S3**  
   Then Terraform was already using S3 (empty), so there was nothing to migrate. To copy **existing** local state into S3 you must run the migration while Terraform is still using the **local** backend:
   - **If you have a backup** of your state (e.g. `terraform.tfstate.backup.local` or a copy from another machine):
     1. Put it in the module dir as `terraform.tfstate`:  
        `cp /path/to/backup/terraform.tfstate apps/frontend/terraform/terraform.tfstate`
     2. Temporarily use the local backend: in `apps/frontend/terraform/backend.tf` set:
        ```hcl
        terraform { backend "local" { path = "terraform.tfstate" } }
        ```
     3. Run `terraform init -reconfigure` in that directory (so Terraform uses the local file).
     4. Restore the S3 backend in `backend.tf` (bucket, key, region, dynamodb_table, encrypt as before).
     5. From repo root run:  
        `echo "yes" | bash backend-config/tf-migrate-state-s3.sh apps/frontend/terraform`  
        and confirm when asked to copy state to the new backend.
   - **If you have no backup**, you cannot recover old state; run `terraform apply` to create resources and new state in S3.

## Terraform + AWS SSO ("profile default is configured to use SSO but is missing sso_region, sso_start_url")

If `aws sts get-caller-identity` works but `terraform init` fails with that error, Terraform is reading a `[default]` profile that has SSO enabled but incomplete. Fix it in `~/.aws/config`:

1. **Option A – Complete the default profile**  
   Ensure your `[default]` block includes SSO settings, for example:

   ```ini
   [default]
   sso_start_url = https://your-org.awsapps.com/start
   sso_region    = us-east-1
   sso_account_id = 838284111015
   sso_role_name  = AdministratorAccess
   region         = us-east-1
   ```

   (Use your real SSO start URL and role from your organization.)

2. **Option B – Use a named profile**  
   If you use a named profile (e.g. `[profile mycompany]`) that works with `aws sts get-caller-identity --profile mycompany`, run Terraform with that profile:

   ```bash
   export AWS_PROFILE=mycompany
   cd apps/frontend/terraform
   terraform init -reconfigure -backend-config=../../../backend-config/dev.hcl
   ```

### "SSO session has expired or is invalid" / "no such file or directory" (cache file)

If `aws sts get-caller-identity` works but Terraform fails with **no valid credential sources** and **SSOProviderInvalidToken** or a missing `.aws/sso/cache/...json` file, Terraform is looking for a different SSO cache file than the one the CLI uses. The simplest fix is to give Terraform the same credentials via environment variables:

1. Log in with SSO (if needed):
   ```bash
   aws sso login
   ```

2. Export the current session into your shell (AWS CLI v2):
   ```bash
   eval $(aws configure export-credentials --format env)
   ```

3. **Unset AWS_PROFILE** so Terraform uses env credentials instead of the SSO profile:
   ```bash
   unset AWS_PROFILE
   ```

4. Run Terraform in the **same shell**:
   ```bash
   cd /path/to/questbound-forge/apps/frontend/terraform
   terraform init -reconfigure -backend-config=../../../backend-config/dev.hcl
   ```

Terraform will use `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN` from the environment. When the session expires, run `aws sso login`, the `eval $(aws configure export-credentials ...)` again, and `unset AWS_PROFILE` if you set it.

**If you still get "No AWSAccessKey was presented"**, the S3 backend may not be reading env vars. Use the helper script (from repo root) so credentials are written into a single backend config file:

```bash
aws sso login
cd /path/to/questbound-forge
./backend-config/tf-init-s3.sh apps/frontend/terraform
```

The script exports your SSO credentials, writes a combined `backend-config/dev-with-creds.hcl` (gitignored), and runs `terraform init`. Re-run the script after each new SSO login when the session expires.

### "tls: failed to verify certificate" / "x509: OSStatus -26276"

On macOS, Terraform (Go) can sometimes fail to verify AWS TLS certificates. The helper scripts (`tf-init-s3.sh`, `tf-migrate-state-s3.sh`) **automatically** try to fix this on macOS by exporting system root certificates and setting `SSL_CERT_FILE` and `AWS_CA_BUNDLE` so the AWS SDK uses that bundle.

If you still see the error:

1. **Run from a normal Terminal** (not an IDE-integrated terminal), after `aws sso login`, so the keychain is available.
2. **Export certs manually** and run Terraform in the same shell:
   ```bash
   security find-certificate -a -p /System/Library/Keychains/SystemRootCertificates.keychain > /tmp/ca-bundle.pem
   export SSL_CERT_FILE=/tmp/ca-bundle.pem
   export AWS_CA_BUNDLE=/tmp/ca-bundle.pem
   bash backend-config/tf-init-s3.sh apps/frontend/terraform
   ```
3. **Corporate proxy/custom CA:** If your network uses a custom CA, add it to macOS Keychain (System keychain) or set `AWS_CA_BUNDLE` to a PEM file that includes that CA.

## Changing environment

To switch an already-initialized module to another environment, re-run `init` with the new backend config:

```bash
terraform init -reconfigure -backend-config=../../../backend-config/staging.hcl
```

`-reconfigure` tells Terraform to adopt the new backend config instead of migrating state.
