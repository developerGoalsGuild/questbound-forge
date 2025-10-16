/**
 * useAccessibilityTesting Hook
 * 
 * A custom hook for running accessibility tests and managing accessibility state.
 */

import { useState, useCallback, useEffect } from 'react';

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

interface AccessibilityTestingState {
  report: AccessibilityReport | null;
  isRunning: boolean;
  error: string | null;
  lastRun: Date | null;
}

interface AccessibilityTestingActions {
  runTests: () => Promise<void>;
  clearReport: () => void;
  downloadReport: () => void;
  getTestById: (id: string) => AccessibilityTest | undefined;
  getTestsByStatus: (status: string) => AccessibilityTest[];
  getScore: () => number;
  hasFailures: () => boolean;
  hasWarnings: () => boolean;
}

export const useAccessibilityTesting = (): AccessibilityTestingState & AccessibilityTestingActions => {
  const [state, setState] = useState<AccessibilityTestingState>({
    report: null,
    isRunning: false,
    error: null,
    lastRun: null,
  });

  const runTests = useCallback(async () => {
    setState(prev => ({ ...prev, isRunning: true, error: null }));

    try {
      // Import the accessibility tester dynamically
      const { default: AccessibilityTester } = await import('@/scripts/test-accessibility');
      const tester = new AccessibilityTester();
      const report = await tester.runAllTests();

      setState(prev => ({
        ...prev,
        report,
        isRunning: false,
        lastRun: new Date(),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, []);

  const clearReport = useCallback(() => {
    setState(prev => ({
      ...prev,
      report: null,
      error: null,
    }));
  }, []);

  const downloadReport = useCallback(() => {
    if (!state.report) return;

    const reportText = generateReportText(state.report);
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.report]);

  const getTestById = useCallback((id: string): AccessibilityTest | undefined => {
    return state.report?.tests.find(test => test.id === id);
  }, [state.report]);

  const getTestsByStatus = useCallback((status: string): AccessibilityTest[] => {
    return state.report?.tests.filter(test => test.status === status) || [];
  }, [state.report]);

  const getScore = useCallback((): number => {
    return state.report?.score || 0;
  }, [state.report]);

  const hasFailures = useCallback((): boolean => {
    return (state.report?.failed || 0) > 0;
  }, [state.report]);

  const hasWarnings = useCallback((): boolean => {
    return (state.report?.warnings || 0) > 0;
  }, [state.report]);

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

  // Auto-run tests in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !state.report && !state.isRunning) {
      runTests();
    }
  }, [runTests, state.report, state.isRunning]);

  return {
    ...state,
    runTests,
    clearReport,
    downloadReport,
    getTestById,
    getTestsByStatus,
    getScore,
    hasFailures,
    hasWarnings,
  };
};

export default useAccessibilityTesting;

