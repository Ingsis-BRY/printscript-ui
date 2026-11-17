import {TestStatus} from "../types/TestCase.ts";

export const testStatusColor = (status: TestStatus): 'default' | 'success' | 'error' | 'warning' => {
  switch (status) {
    case 'passed': return 'success'
    case 'failed': return 'error'
    case 'error': return 'warning'
    default: return 'default'
  }
}
