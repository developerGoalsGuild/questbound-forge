# Selenium Grid Setup on Windows - Step-by-Step Guide

This guide covers installing and configuring Selenium Grid on a Windows machine to enable distributed test execution.

---

## Prerequisites

- Windows 10 or later
- Java Runtime Environment (JRE) 11 or later installed and added to PATH
- Chrome and/or Firefox browsers installed (or other browsers you want to test)
- ChromeDriver and/or GeckoDriver binaries (for Chrome and Firefox respectively)
- Internet connection to download required binaries

---

## Step 1: Install Java

1. Download the latest JRE or JDK from [Oracle](https://www.oracle.com/java/technologies/downloads/) or [Adoptium](https://adoptium.net/).
2. Install Java and ensure `java` command is available in your command prompt:
   ```sh
   java -version
   ```
3. Add Java `bin` directory to your system PATH if not already done.

---

## Step 2: Download Selenium Server Standalone

1. Go to the Selenium official downloads page: https://www.selenium.dev/downloads/
2. Under "Selenium Server (Grid)", download the latest stable `selenium-server-<version>.jar` file.
3. Place the `.jar` file in a dedicated folder, e.g., `C:\selenium-grid`.

---

## Step 3: Download Browser Drivers

### ChromeDriver

1. Check your Chrome version: open Chrome > Menu > Help > About Google Chrome.
2. Download matching ChromeDriver from https://chromedriver.chromium.org/downloads
3. Extract and place `chromedriver.exe` in a folder, e.g., `C:\selenium-grid\drivers`.

### GeckoDriver (Firefox)

1. Download GeckoDriver from https://github.com/mozilla/geckodriver/releases
2. Extract and place `geckodriver.exe` in the same drivers folder.

---

## Step 4: Configure Selenium Grid Hub

1. Open a command prompt and navigate to the Selenium folder:
   ```sh
   cd C:\selenium-grid
   ```
2. Start the Selenium Grid Hub:
   ```sh
   java -jar selenium-server-<version>.jar hub
   ```
3. The hub will start on default port 4444.
4. Verify by opening http://localhost:4444/grid/console in your browser.

---

## Step 5: Configure Selenium Grid Nodes

You can run nodes on the same or different machines.

1. Open a new command prompt.
2. Navigate to the Selenium folder:
   ```sh
   cd C:\selenium-grid
   ```
3. Start a node and register it to the hub:
   ```sh
   java -Dwebdriver.chrome.driver=C:\selenium-grid\drivers\chromedriver.exe -Dwebdriver.gecko.driver=C:\selenium-grid\drivers\geckodriver.exe -jar selenium-server-<version>.jar node --detect-drivers true --hub http://localhost:4444
   ```
4. This will start a node with Chrome and Firefox drivers registered to the hub.
5. Verify node registration at http://localhost:4444/grid/console

---

## Step 6: Running Tests Against Selenium Grid

- Configure your test scripts to use the Selenium Grid Hub URL, e.g.:
  ```
  http://localhost:4444/wd/hub
  ```
- Use desired capabilities to specify browser type (chrome, firefox, etc.)
- Run your tests; they will be distributed to available nodes.

---

## Optional: Running Hub and Nodes as Windows Services

- Use tools like NSSM (Non-Sucking Service Manager) to run Java commands as Windows services.
- This allows Selenium Grid to start automatically on system boot.

---

## Troubleshooting

- Ensure Java version compatibility.
- Check driver versions match browser versions.
- Confirm firewall allows communication on port 4444.
- Review Selenium server logs for errors.

---

## Summary

You now have a Selenium Grid setup on Windows with a hub and nodes ready to run distributed browser tests. Use the hub URL in your test automation scripts to leverage parallel and cross-browser testing.

---

# References

- Selenium official docs: https://www.selenium.dev/documentation/grid/
- ChromeDriver: https://chromedriver.chromium.org/
- GeckoDriver: https://github.com/mozilla/geckodriver
- Java downloads: https://adoptium.net/
