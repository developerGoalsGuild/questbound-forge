Execute browser-based integration tests against my dev site at http://localhost:8080 using Playwright inside a local Docker container. 
Use the environment variables GOALSGUILD_USER and GOALSGUILD_PASSWORD for authentication. 
Produce artifacts (screenshots, videos, traces, HTML + JUnit reports) and fail the run on any test failure.

Constraints & Assumptions

Base URL: http://host.docker.internal:8080 (works on Docker Desktop for Windows/macOS).
If host.docker.internal is unavailable (some Linux setups), add --add-host=host.docker.internal:host-gateway to docker run and keep the same base URL.
Run headless in Chromium (you may also run WebKit/Firefox if time allows).
Never print secrets to logs. Read credentials only from GOALSGUILD_USER and GOALSGUILD_PASSWORD.
Exit non-zero on any failure.
Produce artifacts in a mounted ./playwright-report folder in the host project.


Test Plan (minimum)
Health check / Home loads
Navigate to /, assert 200 OK equivalent (page loaded without network errors), title or a key selector exists.
Auth: login with env credentials
Use GOALSGUILD_USER and GOALSGUILD_PASSWORD.

Assert successful login (presence of user avatar/name, redirect to dashboard, or HTTP 200 + app state).


Non-flaky discipline
Use await expect(...).toBeVisible() with sensible timeouts, page.waitForURL() after navigations, and data-test selectors if available.

Reporting & Artifact
Reporters: list,junit,html.
Save to ./playwright-report on the host:
JUnit XML at ./playwright-report/junit.xml
HTML report at ./playwright-report/html/
Videos, screenshots, and traces per test under ./playwright-report/artifacts/


On failure, attach screenshot + trace.

Commands to run (you may adapt versions as needed):
# From the project root on the HOST machine
# Ensure env vars are set in the host shell (do NOT echo them).
# Windows PowerShell example:
# $env:GOALSGUILD_USER="your_user"; $env:GOALSGUILD_PASSWORD="your_password"
# Linux/macOS example:
# export GOALSGUILD_USER=your_user; export GOALSGUILD_PASSWORD=your_password


Deliverables

./playwright-report/junit.xml (JUnit report)
./playwright-report/html/index.html (HTML report)
./playwright-report/artifacts/ (screenshots, videos, traces)
Non-zero exit code on test failures.

Rules
Do not echo or log the actual values of GOALSGUILD_USER or GOALSGUILD_PASSWORD.
Use robust waits (expect().toBeVisible, waitForURL) instead of arbitrary waitForTimeout.
If selectors differ in my app, prefer data-testid/data-test if present; otherwise use accessible roles/labels.