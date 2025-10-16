/**
 * Accessibility Testing Script
 * 
 * Automated accessibility testing for the GoalsGuild QuestBound Forge application.
 * This script can be run in the browser console or as part of automated testing.
 */

interface AccessibilityTest {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  element?: HTMLElement;
  recommendation?: string;
}

interface AccessibilityReport {
  timestamp: string;
  url: string;
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  score: number;
  tests: AccessibilityTest[];
}

class AccessibilityTester {
  private tests: AccessibilityTest[] = [];

  /**
   * Run all accessibility tests
   */
  async runAllTests(): Promise<AccessibilityReport> {
    this.tests = [];
    
    // Run all test categories
    this.testHeadingHierarchy();
    this.testImageAltText();
    this.testFormLabels();
    this.testAriaLiveRegions();
    this.testFocusManagement();
    this.testColorContrast();
    this.testKeyboardNavigation();
    this.testButtonAccessibility();
    this.testModalAccessibility();
    this.testErrorHandling();
    this.testInternationalization();
    this.testSemanticHTML();
    this.testAriaAttributes();
    this.testListAccessibility();
    this.testIconAccessibility();
    this.testContentStructure();

    const passed = this.tests.filter(t => t.status === 'pass').length;
    const failed = this.tests.filter(t => t.status === 'fail').length;
    const warnings = this.tests.filter(t => t.status === 'warning').length;
    const score = Math.round((passed / this.tests.length) * 100);

    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      totalTests: this.tests.length,
      passed,
      failed,
      warnings,
      score,
      tests: this.tests
    };
  }

  /**
   * Test heading hierarchy
   */
  private testHeadingHierarchy(): void {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
    
    let hasProperHierarchy = true;
    let currentLevel = 0;
    let issues: string[] = [];
    
    for (let i = 0; i < headingLevels.length; i++) {
      const level = headingLevels[i];
      if (level > currentLevel + 1) {
        hasProperHierarchy = false;
        issues.push(`Heading ${level} follows heading ${currentLevel} (skipped level ${currentLevel + 1})`);
      }
      currentLevel = level;
    }

    this.addTest({
      id: 'heading-hierarchy',
      name: 'Heading Hierarchy',
      status: hasProperHierarchy ? 'pass' : 'fail',
      message: hasProperHierarchy 
        ? 'Proper heading hierarchy detected' 
        : `Heading hierarchy issues: ${issues.join(', ')}`,
      recommendation: hasProperHierarchy 
        ? undefined 
        : 'Ensure headings follow a logical order (h1 → h2 → h3, etc.)'
    });
  }

  /**
   * Test image alt text
   */
  private testImageAltText(): void {
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
    const decorativeImages = Array.from(images).filter(img => 
      img.alt === '' && img.getAttribute('role') === 'presentation'
    );
    
    this.addTest({
      id: 'image-alt-text',
      name: 'Image Alt Text',
      status: imagesWithoutAlt.length === 0 ? 'pass' : 'fail',
      message: imagesWithoutAlt.length === 0 
        ? `All ${images.length} images have proper alt text` 
        : `${imagesWithoutAlt.length} images missing alt text`,
      recommendation: imagesWithoutAlt.length > 0 
        ? 'Add alt text to all images or mark decorative images with role="presentation"'
        : undefined
    });
  }

  /**
   * Test form labels
   */
  private testFormLabels(): void {
    const inputs = document.querySelectorAll('input, select, textarea');
    const inputsWithoutLabels = Array.from(inputs).filter(input => {
      const id = input.id;
      const label = document.querySelector(`label[for="${id}"]`);
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      
      return !label && !ariaLabel && !ariaLabelledby;
    });

    this.addTest({
      id: 'form-labels',
      name: 'Form Labels',
      status: inputsWithoutLabels.length === 0 ? 'pass' : 'fail',
      message: inputsWithoutLabels.length === 0 
        ? `All ${inputs.length} form inputs have labels` 
        : `${inputsWithoutLabels.length} form inputs missing labels`,
      recommendation: inputsWithoutLabels.length > 0 
        ? 'Add labels to all form inputs using <label>, aria-label, or aria-labelledby'
        : undefined
    });
  }

  /**
   * Test ARIA live regions
   */
  private testAriaLiveRegions(): void {
    const liveRegions = document.querySelectorAll('[aria-live]');
    const politeRegions = document.querySelectorAll('[aria-live="polite"]');
    const assertiveRegions = document.querySelectorAll('[aria-live="assertive"]');
    
    this.addTest({
      id: 'aria-live-regions',
      name: 'ARIA Live Regions',
      status: liveRegions.length > 0 ? 'pass' : 'warning',
      message: liveRegions.length > 0 
        ? `${liveRegions.length} ARIA live regions found (${politeRegions.length} polite, ${assertiveRegions.length} assertive)` 
        : 'No ARIA live regions found - consider adding for dynamic content',
      recommendation: liveRegions.length === 0 
        ? 'Add ARIA live regions for dynamic content updates'
        : undefined
    });
  }

  /**
   * Test focus management
   */
  private testFocusManagement(): void {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const elementsWithTabIndex = document.querySelectorAll('[tabindex]');
    const elementsWithNegativeTabIndex = document.querySelectorAll('[tabindex="-1"]');
    
    this.addTest({
      id: 'focus-management',
      name: 'Focus Management',
      status: focusableElements.length > 0 ? 'pass' : 'warning',
      message: `${focusableElements.length} focusable elements found`,
      recommendation: focusableElements.length === 0 
        ? 'Ensure interactive elements are keyboard accessible'
        : undefined
    });
  }

  /**
   * Test color contrast (simplified)
   */
  private testColorContrast(): void {
    const elements = document.querySelectorAll('*');
    let lowContrastElements = 0;
    let checkedElements = 0;
    
    // Check a sample of elements for basic contrast
    elements.forEach(element => {
      if (checkedElements >= 100) return; // Limit checks for performance
      
      const computedStyle = window.getComputedStyle(element);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      
      if (color && backgroundColor && color !== backgroundColor) {
        // Basic contrast check - in production, use a proper contrast checker
        if (color === 'rgb(0, 0, 0)' && backgroundColor === 'rgb(255, 255, 255)') {
          // High contrast
        } else if (color === 'rgb(255, 255, 255)' && backgroundColor === 'rgb(0, 0, 0)') {
          // High contrast
        } else {
          lowContrastElements++;
        }
        checkedElements++;
      }
    });

    this.addTest({
      id: 'color-contrast',
      name: 'Color Contrast',
      status: lowContrastElements < 10 ? 'pass' : 'warning',
      message: lowContrastElements < 10 
        ? 'Color contrast appears adequate' 
        : `${lowContrastElements} elements may have low contrast`,
      recommendation: lowContrastElements >= 10 
        ? 'Use a proper contrast checker to verify WCAG AA compliance'
        : undefined
    });
  }

  /**
   * Test keyboard navigation
   */
  private testKeyboardNavigation(): void {
    const interactiveElements = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]');
    const elementsWithoutTabIndex = Array.from(interactiveElements).filter(el => {
      const tabIndex = el.getAttribute('tabindex');
      return !tabIndex || tabIndex === '0';
    });

    this.addTest({
      id: 'keyboard-navigation',
      name: 'Keyboard Navigation',
      status: elementsWithoutTabIndex.length === interactiveElements.length ? 'pass' : 'warning',
      message: elementsWithoutTabIndex.length === interactiveElements.length 
        ? 'All interactive elements are keyboard accessible' 
        : 'Some elements may not be keyboard accessible',
      recommendation: elementsWithoutTabIndex.length < interactiveElements.length 
        ? 'Ensure all interactive elements are keyboard accessible'
        : undefined
    });
  }

  /**
   * Test button accessibility
   */
  private testButtonAccessibility(): void {
    const buttons = document.querySelectorAll('button');
    const buttonsWithoutLabels = Array.from(buttons).filter(button => {
      const text = button.textContent?.trim();
      const ariaLabel = button.getAttribute('aria-label');
      const ariaLabelledby = button.getAttribute('aria-labelledby');
      
      return !text && !ariaLabel && !ariaLabelledby;
    });

    this.addTest({
      id: 'button-accessibility',
      name: 'Button Accessibility',
      status: buttonsWithoutLabels.length === 0 ? 'pass' : 'fail',
      message: buttonsWithoutLabels.length === 0 
        ? `All ${buttons.length} buttons have accessible labels` 
        : `${buttonsWithoutLabels.length} buttons missing accessible labels`,
      recommendation: buttonsWithoutLabels.length > 0 
        ? 'Add text content, aria-label, or aria-labelledby to all buttons'
        : undefined
    });
  }

  /**
   * Test modal accessibility
   */
  private testModalAccessibility(): void {
    const modals = document.querySelectorAll('[role="dialog"], [role="alertdialog"]');
    const modalsWithoutLabels = Array.from(modals).filter(modal => {
      const ariaLabel = modal.getAttribute('aria-label');
      const ariaLabelledby = modal.getAttribute('aria-labelledby');
      
      return !ariaLabel && !ariaLabelledby;
    });

    this.addTest({
      id: 'modal-accessibility',
      name: 'Modal Accessibility',
      status: modalsWithoutLabels.length === 0 ? 'pass' : 'warning',
      message: modalsWithoutLabels.length === 0 
        ? `All ${modals.length} modals have proper labels` 
        : `${modalsWithoutLabels.length} modals missing labels`,
      recommendation: modalsWithoutLabels.length > 0 
        ? 'Add aria-label or aria-labelledby to all modals'
        : undefined
    });
  }

  /**
   * Test error handling
   */
  private testErrorHandling(): void {
    const errorElements = document.querySelectorAll('[role="alert"]');
    const errorMessages = document.querySelectorAll('.text-red-600, .text-red-500, [class*="error"]');
    
    this.addTest({
      id: 'error-handling',
      name: 'Error Handling',
      status: errorElements.length > 0 ? 'pass' : 'warning',
      message: errorElements.length > 0 
        ? `${errorElements.length} error messages have proper ARIA roles` 
        : `${errorMessages.length} error messages found, but none have role="alert"`,
      recommendation: errorMessages.length > 0 && errorElements.length === 0 
        ? 'Add role="alert" to error messages for screen reader announcements'
        : undefined
    });
  }

  /**
   * Test internationalization
   */
  private testInternationalization(): void {
    const elementsWithText = document.querySelectorAll('*');
    const elementsWithHardcodedText = Array.from(elementsWithText).filter(el => {
      const text = el.textContent?.trim();
      return text && text.length > 0 && !el.hasAttribute('data-i18n') && !el.hasAttribute('data-translate');
    });

    this.addTest({
      id: 'internationalization',
      name: 'Internationalization',
      status: 'info',
      message: `${elementsWithHardcodedText.length} elements with text content found`,
      recommendation: 'Consider using translation keys for all user-facing text'
    });
  }

  /**
   * Test semantic HTML
   */
  private testSemanticHTML(): void {
    const semanticElements = document.querySelectorAll('main, nav, section, article, aside, header, footer');
    const divElements = document.querySelectorAll('div');
    
    this.addTest({
      id: 'semantic-html',
      name: 'Semantic HTML',
      status: semanticElements.length > 0 ? 'pass' : 'warning',
      message: semanticElements.length > 0 
        ? `${semanticElements.length} semantic elements found` 
        : 'No semantic HTML elements found',
      recommendation: semanticElements.length === 0 
        ? 'Use semantic HTML elements (main, nav, section, etc.) for better structure'
        : undefined
    });
  }

  /**
   * Test ARIA attributes
   */
  private testAriaAttributes(): void {
    const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
    const elementsWithInvalidAria = Array.from(elementsWithAria).filter(el => {
      const ariaLabel = el.getAttribute('aria-label');
      const ariaLabelledby = el.getAttribute('aria-labelledby');
      const ariaDescribedby = el.getAttribute('aria-describedby');
      
      // Check if referenced elements exist
      if (ariaLabelledby && !document.getElementById(ariaLabelledby)) return true;
      if (ariaDescribedby && !document.getElementById(ariaDescribedby)) return true;
      
      return false;
    });

    this.addTest({
      id: 'aria-attributes',
      name: 'ARIA Attributes',
      status: elementsWithInvalidAria.length === 0 ? 'pass' : 'fail',
      message: elementsWithInvalidAria.length === 0 
        ? `All ${elementsWithAria.length} ARIA attributes are valid` 
        : `${elementsWithInvalidAria.length} ARIA attributes reference non-existent elements`,
      recommendation: elementsWithInvalidAria.length > 0 
        ? 'Fix ARIA attributes that reference non-existent elements'
        : undefined
    });
  }

  /**
   * Test list accessibility
   */
  private testListAccessibility(): void {
    const lists = document.querySelectorAll('ul, ol');
    const listItems = document.querySelectorAll('li');
    const listItemsWithoutLists = document.querySelectorAll('li:not(ul li):not(ol li)');
    
    this.addTest({
      id: 'list-accessibility',
      name: 'List Accessibility',
      status: listItemsWithoutLists.length === 0 ? 'pass' : 'warning',
      message: listItemsWithoutLists.length === 0 
        ? `All ${listItems.length} list items are properly contained in lists` 
        : `${listItemsWithoutLists.length} list items found outside of lists`,
      recommendation: listItemsWithoutLists.length > 0 
        ? 'Ensure all list items are contained within ul or ol elements'
        : undefined
    });
  }

  /**
   * Test icon accessibility
   */
  private testIconAccessibility(): void {
    const icons = document.querySelectorAll('svg, [class*="icon"]');
    const iconsWithoutAria = Array.from(icons).filter(icon => {
      const ariaLabel = icon.getAttribute('aria-label');
      const ariaHidden = icon.getAttribute('aria-hidden');
      const role = icon.getAttribute('role');
      
      return !ariaLabel && !ariaHidden && !role;
    });

    this.addTest({
      id: 'icon-accessibility',
      name: 'Icon Accessibility',
      status: iconsWithoutAria.length === 0 ? 'pass' : 'warning',
      message: iconsWithoutAria.length === 0 
        ? `All ${icons.length} icons have proper ARIA attributes` 
        : `${iconsWithoutAria.length} icons missing ARIA attributes`,
      recommendation: iconsWithoutAria.length > 0 
        ? 'Add aria-label, aria-hidden="true", or role="img" to all icons'
        : undefined
    });
  }

  /**
   * Test content structure
   */
  private testContentStructure(): void {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const h1Elements = document.querySelectorAll('h1');
    const mainElements = document.querySelectorAll('main');
    
    this.addTest({
      id: 'content-structure',
      name: 'Content Structure',
      status: h1Elements.length === 1 && mainElements.length === 1 ? 'pass' : 'warning',
      message: h1Elements.length === 1 && mainElements.length === 1 
        ? 'Good content structure with single h1 and main element' 
        : `Found ${h1Elements.length} h1 elements and ${mainElements.length} main elements`,
      recommendation: h1Elements.length !== 1 || mainElements.length !== 1 
        ? 'Ensure there is exactly one h1 and one main element per page'
        : undefined
    });
  }

  /**
   * Add a test result
   */
  private addTest(test: AccessibilityTest): void {
    this.tests.push(test);
  }

  /**
   * Generate a detailed report
   */
  generateReport(report: AccessibilityReport): string {
    let output = `\n=== ACCESSIBILITY TEST REPORT ===\n`;
    output += `Timestamp: ${report.timestamp}\n`;
    output += `URL: ${report.url}\n`;
    output += `Score: ${report.score}% (${report.passed}/${report.totalTests} passed)\n`;
    output += `Failed: ${report.failed}\n`;
    output += `Warnings: ${report.warnings}\n\n`;

    // Group tests by status
    const failed = report.tests.filter(t => t.status === 'fail');
    const warnings = report.tests.filter(t => t.status === 'warning');
    const passed = report.tests.filter(t => t.status === 'pass');

    if (failed.length > 0) {
      output += `❌ FAILED TESTS (${failed.length}):\n`;
      failed.forEach(test => {
        output += `  • ${test.name}: ${test.message}\n`;
        if (test.recommendation) {
          output += `    Recommendation: ${test.recommendation}\n`;
        }
      });
      output += `\n`;
    }

    if (warnings.length > 0) {
      output += `⚠️  WARNINGS (${warnings.length}):\n`;
      warnings.forEach(test => {
        output += `  • ${test.name}: ${test.message}\n`;
        if (test.recommendation) {
          output += `    Recommendation: ${test.recommendation}\n`;
        }
      });
      output += `\n`;
    }

    if (passed.length > 0) {
      output += `✅ PASSED TESTS (${passed.length}):\n`;
      passed.forEach(test => {
        output += `  • ${test.name}: ${test.message}\n`;
      });
    }

    return output;
  }
}

// Export for use in browser console or automated testing
if (typeof window !== 'undefined') {
  (window as any).AccessibilityTester = AccessibilityTester;
  
  // Auto-run if in development
  if (process.env.NODE_ENV === 'development') {
    const tester = new AccessibilityTester();
    tester.runAllTests().then(report => {
      console.log(tester.generateReport(report));
    });
  }
}

export default AccessibilityTester;

