/**
 * Accessibility Test Page
 * 
 * A dedicated page for testing accessibility features and running accessibility audits.
 * This page is only available in development mode.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  RefreshCw,
  Download,
  Eye,
  Keyboard,
  Volume2,
  Palette,
  Code,
  TestTube
} from 'lucide-react';
import { AccessibilityTest } from '@/components/ui/accessibility-test';
import { useTranslation } from '@/hooks/useTranslation';

interface AccessibilityTestResult {
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
  tests: AccessibilityTestResult[];
}

const AccessibilityTestPage: React.FC = () => {
  const { t } = useTranslation();
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isDevelopment) {
      // Auto-run tests on page load in development
      runAccessibilityTests();
    }
  }, [isDevelopment]);

  const runAccessibilityTests = async () => {
    setIsRunning(true);
    
    try {
      // Import and run the accessibility tester
      const { default: AccessibilityTester } = await import('@/scripts/test-accessibility');
      const tester = new AccessibilityTester();
      const testReport = await tester.runAllTests();
      
      setReport(testReport);
      setActiveTab('results');
    } catch (error) {
      console.error('Failed to run accessibility tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    const reportText = generateReportText(report);
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReportText = (report: AccessibilityReport): string => {
    let output = `ACCESSIBILITY TEST REPORT\n`;
    output += `========================\n\n`;
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
      output += `FAILED TESTS (${failed.length}):\n`;
      output += `============================\n`;
      failed.forEach(test => {
        output += `• ${test.name}: ${test.message}\n`;
        if (test.recommendation) {
          output += `  Recommendation: ${test.recommendation}\n`;
        }
        output += `\n`;
      });
    }

    if (warnings.length > 0) {
      output += `WARNINGS (${warnings.length}):\n`;
      output += `==========================\n`;
      warnings.forEach(test => {
        output += `• ${test.name}: ${test.message}\n`;
        if (test.recommendation) {
          output += `  Recommendation: ${test.recommendation}\n`;
        }
        output += `\n`;
      });
    }

    if (passed.length > 0) {
      output += `PASSED TESTS (${passed.length}):\n`;
      output += `============================\n`;
      passed.forEach(test => {
        output += `• ${test.name}: ${test.message}\n`;
      });
    }

    return output;
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

  if (!isDevelopment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This page is only available in development mode.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Accessibility Testing</h1>
        <p className="text-gray-600">
          Test and validate accessibility features across the application.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Visual Testing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  Test color contrast, focus indicators, and visual accessibility
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  Keyboard Testing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  Verify keyboard navigation and focus management
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Screen Reader Testing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  Test screen reader compatibility and announcements
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Code Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  Analyze HTML structure and ARIA attributes
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Run Accessibility Tests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Click the button below to run comprehensive accessibility tests on the current page.
              </p>
              
              <div className="flex gap-2">
                <Button onClick={runAccessibilityTests} disabled={isRunning}>
                  {isRunning ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Run Tests
                    </>
                  )}
                </Button>
                
                {report && (
                  <Button variant="outline" onClick={downloadReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                )}
              </div>

              {report && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{report.passed}</div>
                    <div className="text-sm text-gray-600">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{report.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{report.warnings}</div>
                    <div className="text-sm text-gray-600">Warnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{report.score}%</div>
                    <div className="text-sm text-gray-600">Score</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {report ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Test Results</h2>
                <div className="flex gap-2">
                  <Badge className={report.score >= 80 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    Score: {report.score}%
                  </Badge>
                  <Badge variant="outline">
                    {report.totalTests} tests
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                {report.tests.map(test => (
                  <Card key={test.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(test.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{test.name}</span>
                            <Badge className={getStatusColor(test.status)}>
                              {test.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{test.message}</p>
                          {test.recommendation && (
                            <div className="bg-blue-50 p-3 rounded-md">
                              <p className="text-sm text-blue-800">
                                <strong>Recommendation:</strong> {test.recommendation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <TestTube className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Test Results</h3>
                <p className="text-gray-600 mb-4">
                  Run accessibility tests to see results here.
                </p>
                <Button onClick={runAccessibilityTests} disabled={isRunning}>
                  {isRunning ? 'Running Tests...' : 'Run Tests'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>WCAG 2.1 AA Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Perceivable</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Provide text alternatives for images</li>
                  <li>• Ensure sufficient color contrast</li>
                  <li>• Make content adaptable to different screen sizes</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Operable</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Make all functionality keyboard accessible</li>
                  <li>• Provide sufficient time for users to read content</li>
                  <li>• Avoid content that causes seizures</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Understandable</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use clear and simple language</li>
                  <li>• Make content appear and operate predictably</li>
                  <li>• Help users avoid and correct mistakes</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Robust</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Maximize compatibility with assistive technologies</li>
                  <li>• Use valid HTML and proper ARIA attributes</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Testing Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Browser Extensions</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• axe-core (Chrome, Firefox, Edge)</li>
                  <li>• WAVE Web Accessibility Evaluator</li>
                  <li>• Lighthouse (built into Chrome DevTools)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Screen Readers</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• NVDA (Windows, free)</li>
                  <li>• JAWS (Windows, paid)</li>
                  <li>• VoiceOver (macOS, built-in)</li>
                  <li>• Narrator (Windows, built-in)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Color Contrast Tools</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• WebAIM Color Contrast Checker</li>
                  <li>• Colour Contrast Analyser</li>
                  <li>• Chrome DevTools Color Picker</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccessibilityTestPage;

