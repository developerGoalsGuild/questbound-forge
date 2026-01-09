# Installing Selenium Test Dependencies

If you get "mocha: command not found", you need to install the test dependencies.

## Install Dependencies

```bash
cd apps/frontend
npm install --save-dev mocha selenium-webdriver chromedriver
```

Or if using the existing package.json structure, the dependencies should already be listed. Just run:

```bash
npm install
```

## Verify Installation

```bash
# Check if mocha is installed
npx mocha --version

# Check if selenium-webdriver is installed
npm list selenium-webdriver
```

## Run Tests

After installation:

```bash
npm run test:selenium:landing:verbose
```

## Alternative: Use Local Mocha

If mocha is installed locally in node_modules, the scripts now use `npx mocha` which should find it automatically.

If that doesn't work, you can run directly:

```bash
./node_modules/.bin/mocha src/__tests__/selenium/landing-page-integration.test.js --timeout 120000 --reporter spec
```
