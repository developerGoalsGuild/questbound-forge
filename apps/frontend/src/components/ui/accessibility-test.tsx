/**
 * Accessibility Test Component
 * 
 * A development component for testing accessibility features
 * and providing accessibility debugging information.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface AccessibilityTestProps {
  className?: string;
}

interface AccessibilityCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  element?: HTMLElement;
}

export const AccessibilityTest: React.FC<AccessibilityTestProps> = ({ className }) => {
  const [checks, setChecks] = useState<AccessibilityCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runAccessibilityChecks = () => {
    setIsRunning(true);
    const newChecks: AccessibilityCheck[] = [];

    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
    
    let hasProperHierarchy = true;
    let currentLevel = 0;
    
    for (const level of headingLevels) {
      if (level > currentLevel + 1) {
        hasProperHierarchy = false;
        break;
      }
      currentLevel = level;
    }

    newChecks.push({
      id: 'heading-hierarchy',
      name: 'Heading Hierarchy',
      status: hasProperHierarchy ? 'pass' : 'fail',
      message: hasProperHierarchy 
        ? 'Proper heading hierarchy detected' 
        : 'Heading hierarchy is not properly structured',
    });

    // Check for alt text on images
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
    
    newChecks.push({
      id: 'image-alt-text',
      name: 'Image Alt Text',
      status: imagesWithoutAlt.length === 0 ? 'pass' : 'fail',
      message: imagesWithoutAlt.length === 0 
        ? 'All images have alt text' 
        : `${imagesWithoutAlt.length} images missing alt text`,
    });

    // Check for form labels
    const inputs = document.querySelectorAll('input, select, textarea');
    const inputsWithoutLabels = Array.from(inputs).filter(input => {
      const id = input.id;
      const label = document.querySelector(`label[for="${id}"]`);
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      
      return !label && !ariaLabel && !ariaLabelledby;
    });

    newChecks.push({
      id: 'form-labels',
      name: 'Form Labels',
      status: inputsWithoutLabels.length === 0 ? 'pass' : 'fail',
      message: inputsWithoutLabels.length === 0 
        ? 'All form inputs have labels' 
        : `${inputsWithoutLabels.length} form inputs missing labels`,
    });

    // Check for ARIA live regions
    const liveRegions = document.querySelectorAll('[aria-live]');
    
    newChecks.push({
      id: 'aria-live-regions',
      name: 'ARIA Live Regions',
      status: liveRegions.length > 0 ? 'pass' : 'warning',
      message: liveRegions.length > 0 
        ? `${liveRegions.length} ARIA live regions found` 
        : 'No ARIA live regions found - consider adding for dynamic content',
    });

    // Check for focus management
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    newChecks.push({
      id: 'focusable-elements',
      name: 'Focusable Elements',
      status: focusableElements.length > 0 ? 'pass' : 'warning',
      message: `${focusableElements.length} focusable elements found`,
    });

    // Check for color contrast (simplified check)
    const elements = document.querySelectorAll('*');
    let lowContrastElements = 0;
    
    // This is a simplified check - in a real implementation, you'd use a proper contrast checker
    elements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      
      // Basic check for high contrast colors
      if (color === 'rgb(0, 0, 0)' && backgroundColor === 'rgb(255, 255, 255)') {
        // High contrast
      } else if (color === 'rgb(255, 255, 255)' && backgroundColor === 'rgb(0, 0, 0)') {
        // High contrast
      } else if (color && backgroundColor && color !== backgroundColor) {
        // Has some contrast
      } else {
        lowContrastElements++;
      }
    });

    newChecks.push({
      id: 'color-contrast',
      name: 'Color Contrast',
      status: lowContrastElements < 10 ? 'pass' : 'warning',
      message: lowContrastElements < 10 
        ? 'Color contrast appears adequate' 
        : `${lowContrastElements} elements may have low contrast`,
    });

    // Check for keyboard navigation
    const interactiveElements = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]');
    const elementsWithoutTabIndex = Array.from(interactiveElements).filter(el => {
      const tabIndex = el.getAttribute('tabindex');
      return !tabIndex || tabIndex === '0';
    });

    newChecks.push({
      id: 'keyboard-navigation',
      name: 'Keyboard Navigation',
      status: elementsWithoutTabIndex.length === interactiveElements.length ? 'pass' : 'warning',
      message: elementsWithoutTabIndex.length === interactiveElements.length 
        ? 'All interactive elements are keyboard accessible' 
        : 'Some elements may not be keyboard accessible',
    });

    setChecks(newChecks);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const passCount = checks.filter(c => c.status === 'pass').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Accessibility Test Results
        </CardTitle>
        <div className="flex gap-2">
          <Button onClick={runAccessibilityChecks} disabled={isRunning}>
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </Button>
          {checks.length > 0 && (
            <div className="flex gap-2">
              <Badge className={passCount > 0 ? 'bg-green-100 text-green-800' : ''}>
                {passCount} Pass
              </Badge>
              <Badge className={failCount > 0 ? 'bg-red-100 text-red-800' : ''}>
                {failCount} Fail
              </Badge>
              <Badge className={warningCount > 0 ? 'bg-yellow-100 text-yellow-800' : ''}>
                {warningCount} Warning
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {checks.length === 0 ? (
          <p className="text-gray-500">Click "Run Tests" to check accessibility</p>
        ) : (
          <div className="space-y-3">
            {checks.map(check => (
              <div key={check.id} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(check.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{check.name}</span>
                    <Badge className={getStatusColor(check.status)}>
                      {check.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{check.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

