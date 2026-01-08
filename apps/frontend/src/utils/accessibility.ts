/**
 * Accessibility Utility Functions
 * 
 * Utility functions for accessibility testing, validation, and enhancement.
 */

import { defaultAccessibilityConfig, wcagChecklist, commonIssues } from '@/config/accessibility';

export interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  element?: HTMLElement;
  recommendation?: string;
  wcagLevel?: 'A' | 'AA' | 'AAA';
}

export interface AccessibilityEnhancement {
  element: HTMLElement;
  enhancement: string;
  priority: 'high' | 'medium' | 'low';
  implementation: string;
}

/**
 * Check if an element is visible to screen readers
 */
export const isVisibleToScreenReader = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    rect.width > 0 &&
    rect.height > 0
  );
};

/**
 * Check if an element has proper focus management
 */
export const hasProperFocus = (element: HTMLElement): boolean => {
  const tabIndex = element.getAttribute('tabindex');
  const isInteractive = element.matches('button, [href], input, select, textarea, [tabindex]');
  
  if (!isInteractive) return true;
  
  return tabIndex !== '-1' && (tabIndex === '0' || tabIndex === null);
};

/**
 * Check if an element has proper ARIA attributes
 */
export const hasProperAriaAttributes = (element: HTMLElement): boolean => {
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledby = element.getAttribute('aria-labelledby');
  const ariaDescribedby = element.getAttribute('aria-describedby');
  const textContent = element.textContent?.trim();
  
  // Check if referenced elements exist
  if (ariaLabelledby && !document.getElementById(ariaLabelledby)) return false;
  if (ariaDescribedby && !document.getElementById(ariaDescribedby)) return false;
  
  // Check if element has accessible name
  if (element.matches('button, [role="button"], input, select, textarea')) {
    return !!(ariaLabel || ariaLabelledby || textContent);
  }
  
  return true;
};

/**
 * Check if an element has proper color contrast
 */
export const hasProperColorContrast = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  const color = style.color;
  const backgroundColor = style.backgroundColor;
  
  // Basic contrast check - in production, use a proper contrast checker
  if (color === 'rgb(0, 0, 0)' && backgroundColor === 'rgb(255, 255, 255)') {
    return true; // High contrast
  }
  
  if (color === 'rgb(255, 255, 255)' && backgroundColor === 'rgb(0, 0, 0)') {
    return true; // High contrast
  }
  
  // Add more sophisticated contrast checking here
  return true; // Placeholder
};

/**
 * Check if an element has proper heading hierarchy
 */
export const hasProperHeadingHierarchy = (): boolean => {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
  
  let currentLevel = 0;
  
  for (const level of headingLevels) {
    if (level > currentLevel + 1) {
      return false;
    }
    currentLevel = level;
  }
  
  return true;
};

/**
 * Check if all images have proper alt text
 */
export const hasProperImageAltText = (): boolean => {
  const images = document.querySelectorAll('img');
  
  for (const img of images) {
    const alt = img.getAttribute('alt');
    const role = img.getAttribute('role');
    
    if (!alt && role !== 'presentation') {
      return false;
    }
  }
  
  return true;
};

/**
 * Check if all form inputs have labels
 */
export const hasProperFormLabels = (): boolean => {
  const inputs = document.querySelectorAll('input, select, textarea');
  
  for (const input of inputs) {
    const id = input.id;
    const label = document.querySelector(`label[for="${id}"]`);
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledby = input.getAttribute('aria-labelledby');
    
    if (!label && !ariaLabel && !ariaLabelledby) {
      return false;
    }
  }
  
  return true;
};

/**
 * Check if ARIA live regions are present
 */
export const hasAriaLiveRegions = (): boolean => {
  const liveRegions = document.querySelectorAll('[aria-live]');
  return liveRegions.length > 0;
};

/**
 * Check if error messages have proper ARIA roles
 */
export const hasProperErrorHandling = (): boolean => {
  const errorMessages = document.querySelectorAll('.text-red-600, .text-red-500, [class*="error"]');
  
  for (const error of errorMessages) {
    const role = error.getAttribute('role');
    if (role !== 'alert') {
      return false;
    }
  }
  
  return true;
};

/**
 * Check if semantic HTML elements are used
 */
export const hasSemanticHTML = (): boolean => {
  const semanticElements = document.querySelectorAll('main, nav, section, article, aside, header, footer');
  return semanticElements.length > 0;
};

/**
 * Check if lists are properly structured
 */
export const hasProperListStructure = (): boolean => {
  const listItems = document.querySelectorAll('li');
  const listItemsWithoutLists = document.querySelectorAll('li:not(ul li):not(ol li)');
  
  return listItemsWithoutLists.length === 0;
};

/**
 * Check if icons have proper accessibility attributes
 */
export const hasProperIconAccessibility = (): boolean => {
  const icons = document.querySelectorAll('svg, [class*="icon"]');
  
  for (const icon of icons) {
    const ariaLabel = icon.getAttribute('aria-label');
    const ariaHidden = icon.getAttribute('aria-hidden');
    const role = icon.getAttribute('role');
    
    if (!ariaLabel && !ariaHidden && !role) {
      return false;
    }
  }
  
  return true;
};

/**
 * Get accessibility issues for an element
 */
export const getElementAccessibilityIssues = (element: HTMLElement): AccessibilityIssue[] => {
  const issues: AccessibilityIssue[] = [];
  
  // Check visibility
  if (!isVisibleToScreenReader(element)) {
    issues.push({
      id: 'element-not-visible',
      type: 'warning',
      message: 'Element is not visible to screen readers',
      element,
      recommendation: 'Ensure element is visible and has proper display properties',
    });
  }
  
  // Check focus management
  if (!hasProperFocus(element)) {
    issues.push({
      id: 'element-not-focusable',
      type: 'error',
      message: 'Element is not properly focusable',
      element,
      recommendation: 'Add proper tabindex or use semantic interactive elements',
    });
  }
  
  // Check ARIA attributes
  if (!hasProperAriaAttributes(element)) {
    issues.push({
      id: 'element-missing-aria',
      type: 'error',
      message: 'Element is missing proper ARIA attributes',
      element,
      recommendation: 'Add aria-label, aria-labelledby, or visible text content',
    });
  }
  
  // Check color contrast
  if (!hasProperColorContrast(element)) {
    issues.push({
      id: 'element-poor-contrast',
      type: 'warning',
      message: 'Element may have poor color contrast',
      element,
      recommendation: 'Ensure sufficient color contrast ratio (4.5:1 for normal text)',
    });
  }
  
  return issues;
};

/**
 * Get all accessibility issues on the page
 */
export const getPageAccessibilityIssues = (): AccessibilityIssue[] => {
  const issues: AccessibilityIssue[] = [];
  
  // Check heading hierarchy
  if (!hasProperHeadingHierarchy()) {
    issues.push({
      id: 'heading-hierarchy',
      type: 'error',
      message: 'Heading hierarchy is not properly structured',
      recommendation: 'Ensure headings follow logical order (h1 → h2 → h3, etc.)',
      wcagLevel: 'AA',
    });
  }
  
  // Check image alt text
  if (!hasProperImageAltText()) {
    issues.push({
      id: 'image-alt-text',
      type: 'error',
      message: 'Some images are missing alt text',
      recommendation: 'Add alt text to all images or mark decorative images with role="presentation"',
      wcagLevel: 'AA',
    });
  }
  
  // Check form labels
  if (!hasProperFormLabels()) {
    issues.push({
      id: 'form-labels',
      type: 'error',
      message: 'Some form inputs are missing labels',
      recommendation: 'Add labels to all form inputs using <label>, aria-label, or aria-labelledby',
      wcagLevel: 'AA',
    });
  }
  
  // Check ARIA live regions
  if (!hasAriaLiveRegions()) {
    issues.push({
      id: 'aria-live-regions',
      type: 'warning',
      message: 'No ARIA live regions found for dynamic content',
      recommendation: 'Add ARIA live regions for dynamic content updates',
      wcagLevel: 'AA',
    });
  }
  
  // Check error handling
  if (!hasProperErrorHandling()) {
    issues.push({
      id: 'error-handling',
      type: 'warning',
      message: 'Error messages may not be properly announced',
      recommendation: 'Add role="alert" to error messages for screen reader announcements',
      wcagLevel: 'AA',
    });
  }
  
  // Check semantic HTML
  if (!hasSemanticHTML()) {
    issues.push({
      id: 'semantic-html',
      type: 'warning',
      message: 'No semantic HTML elements found',
      recommendation: 'Use semantic HTML elements (main, nav, section, etc.) for better structure',
      wcagLevel: 'AA',
    });
  }
  
  // Check list structure
  if (!hasProperListStructure()) {
    issues.push({
      id: 'list-structure',
      type: 'warning',
      message: 'Some list items are not properly contained in lists',
      recommendation: 'Ensure all list items are contained within ul or ol elements',
      wcagLevel: 'AA',
    });
  }
  
  // Check icon accessibility
  if (!hasProperIconAccessibility()) {
    issues.push({
      id: 'icon-accessibility',
      type: 'warning',
      message: 'Some icons are missing accessibility attributes',
      recommendation: 'Add aria-label, aria-hidden="true", or role="img" to all icons',
      wcagLevel: 'AA',
    });
  }
  
  return issues;
};

/**
 * Get accessibility enhancements for an element
 */
export const getElementAccessibilityEnhancements = (element: HTMLElement): AccessibilityEnhancement[] => {
  const enhancements: AccessibilityEnhancement[] = [];
  
  // Check if element needs better focus management
  if (element.matches('button, [role="button"]') && !hasProperFocus(element)) {
    enhancements.push({
      element,
      enhancement: 'Improve focus management',
      priority: 'high',
      implementation: 'Add proper tabindex or use semantic button element',
    });
  }
  
  // Check if element needs ARIA attributes
  if (element.matches('input, select, textarea') && !hasProperAriaAttributes(element)) {
    enhancements.push({
      element,
      enhancement: 'Add ARIA attributes',
      priority: 'high',
      implementation: 'Add aria-label, aria-labelledby, or associate with label element',
    });
  }
  
  // Check if element needs better color contrast
  if (!hasProperColorContrast(element)) {
    enhancements.push({
      element,
      enhancement: 'Improve color contrast',
      priority: 'medium',
      implementation: 'Adjust text and background colors to meet WCAG AA standards',
    });
  }
  
  return enhancements;
};

/**
 * Apply accessibility enhancements to an element
 */
export const applyAccessibilityEnhancements = (element: HTMLElement, enhancements: AccessibilityEnhancement[]): void => {
  enhancements.forEach(enhancement => {
    switch (enhancement.enhancement) {
      case 'Improve focus management':
        if (element.matches('button, [role="button"]')) {
          element.setAttribute('tabindex', '0');
        }
        break;
      
      case 'Add ARIA attributes':
        if (element.matches('input, select, textarea')) {
          const label = element.getAttribute('aria-label') || element.getAttribute('placeholder') || 'Input field';
          element.setAttribute('aria-label', label);
        }
        break;
      
      case 'Improve color contrast':
        // This would require more sophisticated color analysis
        console.log('Color contrast improvement requires manual review');
        break;
    }
  });
};

/**
 * Generate accessibility report
 */
export const generateAccessibilityReport = (): string => {
  const issues = getPageAccessibilityIssues();
  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const totalIssues = issues.length;
  
  let report = `ACCESSIBILITY REPORT\n`;
  report += `==================\n\n`;
  report += `Total Issues: ${totalIssues}\n`;
  report += `Errors: ${errorCount}\n`;
  report += `Warnings: ${warningCount}\n\n`;
  
  if (issues.length > 0) {
    report += `ISSUES FOUND:\n`;
    report += `=============\n\n`;
    
    issues.forEach((issue, index) => {
      report += `${index + 1}. ${issue.message}\n`;
      if (issue.recommendation) {
        report += `   Recommendation: ${issue.recommendation}\n`;
      }
      if (issue.wcagLevel) {
        report += `   WCAG Level: ${issue.wcagLevel}\n`;
      }
      report += `\n`;
    });
  } else {
    report += `No accessibility issues found!\n`;
  }
  
  return report;
};

/**
 * Check if page meets accessibility standards
 */
export const meetsAccessibilityStandards = (): boolean => {
  const issues = getPageAccessibilityIssues();
  const errorCount = issues.filter(i => i.type === 'error').length;
  
  return errorCount === 0;
};

/**
 * Get accessibility score (0-100)
 */
export const getAccessibilityScore = (): number => {
  const issues = getPageAccessibilityIssues();
  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  
  // Simple scoring: 100 - (errors * 10) - (warnings * 5)
  const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 5));
  
  return Math.round(score);
};

export default {
  isVisibleToScreenReader,
  hasProperFocus,
  hasProperAriaAttributes,
  hasProperColorContrast,
  hasProperHeadingHierarchy,
  hasProperImageAltText,
  hasProperFormLabels,
  hasAriaLiveRegions,
  hasProperErrorHandling,
  hasSemanticHTML,
  hasProperListStructure,
  hasProperIconAccessibility,
  getElementAccessibilityIssues,
  getPageAccessibilityIssues,
  getElementAccessibilityEnhancements,
  applyAccessibilityEnhancements,
  generateAccessibilityReport,
  meetsAccessibilityStandards,
  getAccessibilityScore,
};

