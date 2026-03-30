# Testing Strategy Specification

## Overview
Comprehensive testing strategy for the financial dashboard, covering unit tests, integration tests, end-to-end tests, and AI response validation.

## Testing Philosophy

### Principles
1. **Test Early, Test Often**: Write tests as you develop features
2. **Test Pyramid**: Many unit tests, some integration tests, few E2E tests
3. **Test Behavior, Not Implementation**: Focus on what code does, not how
4. **Fast Feedback**: Tests should run quickly
5. **Reliable Tests**: Tests should be deterministic and not flaky

### Coverage Goals
- **Unit Tests**: 80% code coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows
- **AI Tests**: All AI response scenarios

## Testing Stack

### Frontend Testing
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "msw": "^2.0.0",
    "playwright": "^1.40.0"
  }
}
```

### Backend Testing
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^2.0.0",
    "nock": "^13.4.0"
  }
}
```

## Unit Testing

### Frontend Unit Tests

#### Component Testing
```typescript
// client/src/components/__tests__/TransactionList.test.tsx

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransactionList } from '../TransactionList'
import { useTransactions } from '@/hooks/useTransactions'

// Mock the hook
vi.mock('@/hooks/useTransactions')

describe('TransactionList', () => {
  const mockTransactions = [
    {
      id: '1',
      description: 'Grocery Store',
      amount: -50.00,
      date: '2024-01-15',
      category: { name: 'Food', color: '#ff0000' }
    },
    {
      id: '2',
      description: 'Salary',
      amount: 5000.00,
      date: '2024-01-01',
      category: { name: 'Income', color: '#00ff00' }
    }
  ]
  
  beforeEach(() => {
    vi.mocked(useTransactions).mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      error: null
    })
  })
  
  it('renders transaction list correctly', () => {
    render(<TransactionList />)
    
    expect(screen.getByText('Grocery Store')).toBeInTheDocument()
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByText('-$50.00')).toBeInTheDocument()
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
  })
  
  it('shows loading state', () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null
    })
    
    render(<TransactionList />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
  
  it('shows error state', () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch')
    })
    
    render(<TransactionList />)
    
    expect(screen.getByText(/error loading transactions/i)).toBeInTheDocument()
  })
  
  it('filters transactions by category', async () => {
    const user = userEvent.setup()
    render(<TransactionList />)
    
    const filterSelect = screen.getByLabelText(/filter by category/i)
    await user.selectOptions(filterSelect, 'Food')
    
    await waitFor(() => {
      expect(screen.getByText('Grocery Store')).toBeInTheDocument()
      expect(screen.queryByText('Salary')).not.toBeInTheDocument()
    })
  })
  
  it('sorts transactions by date', async () => {
    const user = userEvent.setup()
    render(<TransactionList />)
    
    const sortButton = screen.getByRole('button', { name: /sort by date/i })
    await user.click(sortButton)
    
    const transactions = screen.getAllByTestId('transaction-item')
    expect(transactions[0]).toHaveTextContent('Salary')
    expect(transactions[1]).toHaveTextContent('Grocery Store')
  })
})
```

#### Hook Testing
```typescript
// client/src/hooks/__tests__/useTransactions.test.ts

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTransactions } from '../useTransactions'
import { api } from '@/lib/api'

vi.mock('@/lib/api')

describe('useTransactions', () => {
  let queryClient: QueryClient
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false
        }
      }
    })
  })
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
  
  it('fetches transactions successfully', async () => {
    const mockTransactions = [
      { id: '1', description: 'Test', amount: 100 }
    ]
    
    vi.mocked(api.get).mockResolvedValue({ data: mockTransactions })
    
    const { result } = renderHook(() => useTransactions(), { wrapper })
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data).toEqual(mockTransactions)
    })
  })
  
  it('handles fetch error', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
    
    const { result } = renderHook(() => useTransactions(), { wrapper })
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBeInstanceOf(Error)
    })
  })
  
  it('refetches on interval', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] })
    
    const { result } = renderHook(
      () => useTransactions({ refetchInterval: 1000 }),
      { wrapper }
    )
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1)
    })
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2)
    }, { timeout: 2000 })
  })
})
```

#### Utility Testing
```typescript
// client/src/lib/__tests__/utils.test.ts

import { formatCurrency, formatDate, calculatePercentage } from '../utils'

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56')
  })
  
  it('formats EUR correctly', () => {
    expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56')
  })
  
  it('handles negative amounts', () => {
    expect(formatCurrency(-1234.56, 'USD')).toBe('-$1,234.56')
  })
  
  it('handles zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
  })
  
  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(1234.567, 'USD')).toBe('$1,234.57')
  })
})

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-15')
    expect(formatDate(date)).toBe('Jan 15, 2024')
  })
  
  it('handles different formats', () => {
    const date = new Date('2024-01-15')
    expect(formatDate(date, 'short')).toBe('1/15/24')
    expect(formatDate(date, 'long')).toBe('January 15, 2024')
  })
})

describe('calculatePercentage', () => {
  it('calculates percentage correctly', () => {
    expect(calculatePercentage(50, 200)).toBe(25)
  })
  
  it('handles zero total', () => {
    expect(calculatePercentage(50, 0)).toBe(0)
  })
  
  it('rounds to 1 decimal place', () => {
    expect(calculatePercentage(33, 100)).toBe(33)
    expect(calculatePercentage(33.333, 100)).toBe(33.3)
  })
})
```

### Backend Unit Tests

#### Service Testing
```typescript
// server/src/services/__tests__/vertex-ai.test.ts

import { VertexAIService } from '../vertex-ai'
import { buildContext } from '../context-builder'

vi.mock('../context-builder')
vi.mock('@google-cloud/aiplatform')

describe('VertexAIService', () => {
  let service: VertexAIService
  
  beforeEach(() => {
    service = new VertexAIService()
    vi.clearAllMocks()
  })
  
  describe('generateResponse', () => {
    it('generates response successfully', async () => {
      const mockContext = {
        userProfile: { name: 'Test User' },
        financialSummary: { totalBalance: 10000 }
      }
      
      vi.mocked(buildContext).mockResolvedValue(mockContext as any)
      
      const mockResponse = {
        predictions: [{ content: 'Test response' }]
      }
      
      vi.mocked(service.client.predict).mockResolvedValue([mockResponse])
      
      const result = await service.generateResponse(
        'user-123',
        'How much do I spend on food?',
        'spending'
      )
      
      expect(result.content).toBe('Test response')
      expect(result.type).toBe('insight')
    })
    
    it('handles rate limit error', async () => {
      vi.mocked(buildContext).mockResolvedValue({} as any)
      vi.mocked(service.client.predict).mockRejectedValue(
        new Error('Rate limit exceeded')
      )
      
      const result = await service.generateResponse(
        'user-123',
        'Test query',
        'spending'
      )
      
      expect(result.type).toBe('error')
      expect(result.content).toContain('high demand')
    })
    
    it('selects correct model based on complexity', async () => {
      vi.mocked(buildContext).mockResolvedValue({} as any)
      vi.mocked(service.client.predict).mockResolvedValue([
        { predictions: [{ content: 'Response' }] }
      ])
      
      // Simple query should use Flash
      await service.generateResponse(
        'user-123',
        'What is my balance?',
        'spending'
      )
      
      expect(service.client.predict).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: expect.stringContaining('gemini-2.5-flash')
        })
      )
      
      vi.clearAllMocks()
      
      // Complex query should use Pro
      await service.generateResponse(
        'user-123',
        'Analyze my spending patterns and suggest budget optimizations',
        'analysis'
      )
      
      expect(service.client.predict).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: expect.stringContaining('gemini-2.5-pro')
        })
      )
    })
  })
  
  describe('assessQueryComplexity', () => {
    it('returns low complexity for simple queries', () => {
      const complexity = service.assessQueryComplexity(
        'What is my balance?',
        'spending'
      )
      
      expect(complexity).toBeLessThan(0.6)
    })
    
    it('returns high complexity for analysis queries', () => {
      const complexity = service.assessQueryComplexity(
        'Analyze my spending patterns and suggest budget optimizations',
        'analysis'
      )
      
      expect(complexity).toBeGreaterThan(0.7)
    })
  })
})
```

#### Controller Testing
```typescript
// server/src/controllers/__tests__/transactions.test.ts

import request from 'supertest'
import { app } from '../../index'
import { supabase } from '../../services/supabase'

vi.mock('../../services/supabase')

describe('Transactions Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('GET /api/transactions', () => {
    it('returns transactions for authenticated user', async () => {
      const mockTransactions = [
        { id: '1', description: 'Test', amount: 100 }
      ]
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockTransactions,
          error: null
        })
      } as any)
      
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', 'Bearer valid-token')
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockTransactions)
    })
    
    it('returns 401 for unauthenticated user', async () => {
      const response = await request(app)
        .get('/api/transactions')
      
      expect(response.status).toBe(401)
    })
    
    it('handles database error', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error')
        })
      } as any)
      
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', 'Bearer valid-token')
      
      expect(response.status).toBe(500)
    })
  })
  
  describe('POST /api/transactions', () => {
    it('creates transaction successfully', async () => {
      const newTransaction = {
        description: 'New Transaction',
        amount: 100,
        date: '2024-01-15',
        category_id: 'cat-123'
      }
      
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [{ id: '1', ...newTransaction }],
          error: null
        })
      } as any)
      
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', 'Bearer valid-token')
        .send(newTransaction)
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
    })
    
    it('validates required fields', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', 'Bearer valid-token')
        .send({})
      
      expect(response.status).toBe(400)
      expect(response.body.errors).toBeDefined()
    })
  })
})
```

## Integration Testing

### API Integration Tests
```typescript
// server/src/__tests__/integration/transactions.integration.test.ts

import request from 'supertest'
import { app } from '../../index'
import { setupTestDatabase, teardownTestDatabase } from './test-db'

describe('Transactions Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })
  
  afterAll(async () => {
    await teardownTestDatabase()
  })
  
  describe('Full transaction flow', () => {
    let authToken: string
    let accountId: string
    
    it('creates account, adds transaction, and retrieves it', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
      
      authToken = loginResponse.body.token
      
      // Create account
      const accountResponse = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Bank',
          type: 'bank',
          currency: 'USD',
          balance: 1000
        })
      
      accountId = accountResponse.body.id
      
      // Create transaction
      const transactionResponse = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          account_id: accountId,
          description: 'Grocery Store',
          amount: -50,
          date: '2024-01-15',
          category_id: 'cat-food'
        })
      
      expect(transactionResponse.status).toBe(201)
      
      // Retrieve transactions
      const getResponse = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(getResponse.status).toBe(200)
      expect(getResponse.body).toHaveLength(1)
      expect(getResponse.body[0].description).toBe('Grocery Store')
    })
  })
})
```

### Database Integration Tests
```typescript
// server/src/__tests__/integration/database.integration.test.ts

import { supabase } from '../../services/supabase'

describe('Database Integration', () => {
  describe('Transactions CRUD', () => {
    let userId: string
    let transactionId: string
    
    beforeAll(async () => {
      // Create test user
      const { data: user } = await supabase
        .from('users')
        .insert({ email: 'test@example.com', name: 'Test User' })
        .select()
        .single()
      
      userId = user.id
    })
    
    afterAll(async () => {
      // Cleanup
      await supabase.from('transactions').delete().eq('user_id', userId)
      await supabase.from('users').delete().eq('id', userId)
    })
    
    it('creates transaction', async () => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          description: 'Test Transaction',
          amount: 100,
          date: '2024-01-15',
          type: 'expense'
        })
        .select()
        .single()
      
      expect(error).toBeNull()
      expect(data).toHaveProperty('id')
      transactionId = data.id
    })
    
    it('retrieves transaction', async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select()
        .eq('id', transactionId)
        .single()
      
      expect(error).toBeNull()
      expect(data.description).toBe('Test Transaction')
    })
    
    it('updates transaction', async () => {
      const { data, error } = await supabase
        .from('transactions')
        .update({ description: 'Updated Transaction' })
        .eq('id', transactionId)
        .select()
        .single()
      
      expect(error).toBeNull()
      expect(data.description).toBe('Updated Transaction')
    })
    
    it('deletes transaction', async () => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
      
      expect(error).toBeNull()
    })
  })
})
```

## End-to-End Testing

### E2E Test Setup
```typescript
// e2e/playwright.config.ts

import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
})
```

### Critical User Flow Tests
```typescript
// e2e/tests/onboarding.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test('completes onboarding successfully', async ({ page }) => {
    await page.goto('/')
    
    // Welcome screen
    await expect(page.getByText('Welcome to Financial Dashboard')).toBeVisible()
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Profile setup
    await expect(page.getByText('Set Up Your Profile')).toBeVisible()
    await page.getByLabel('Name').fill('Test User')
    await page.getByLabel('Company').fill('Test Company')
    await page.getByRole('button', { name: 'Next' }).click()
    
    // Currency selection
    await expect(page.getByText('Select Your Currency')).toBeVisible()
    await page.getByLabel('Currency').selectOption('USD')
    await page.getByRole('button', { name: 'Next' }).click()
    
    // Account connection
    await expect(page.getByText('Connect Your Accounts')).toBeVisible()
    await page.getByRole('button', { name: 'Add Bank Account' }).click()
    await page.getByLabel('Account Name').fill('Test Bank')
    await page.getByLabel('Balance').fill('1000')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    
    // AI introduction
    await expect(page.getByText('Meet Your AI Assistant')).toBeVisible()
    await page.getByRole('button', { name: 'Finish' }).click()
    
    // Dashboard
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Test Bank')).toBeVisible()
  })
  
  test('can skip onboarding', async ({ page }) => {
    await page.goto('/')
    
    await page.getByRole('button', { name: 'Skip' }).click()
    
    await expect(page.getByText('Dashboard')).toBeVisible()
  })
})
```

```typescript
// e2e/tests/transactions.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Transaction Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()
    
    await expect(page.getByText('Dashboard')).toBeVisible()
  })
  
  test('adds a new transaction', async ({ page }) => {
    await page.getByRole('link', { name: 'Transactions' }).click()
    await page.getByRole('button', { name: 'Add Transaction' }).click()
    
    await page.getByLabel('Description').fill('Grocery Store')
    await page.getByLabel('Amount').fill('50')
    await page.getByLabel('Date').fill('2024-01-15')
    await page.getByLabel('Category').selectOption('Food')
    await page.getByRole('button', { name: 'Save' }).click()
    
    await expect(page.getByText('Grocery Store')).toBeVisible()
    await expect(page.getByText('-$50.00')).toBeVisible()
  })
  
  test('filters transactions by category', async ({ page }) => {
    await page.getByRole('link', { name: 'Transactions' }).click()
    
    await page.getByLabel('Filter by Category').selectOption('Food')
    
    await expect(page.getByText('Grocery Store')).toBeVisible()
    await expect(page.getByText('Salary')).not.toBeVisible()
  })
  
  test('searches transactions', async ({ page }) => {
    await page.getByRole('link', { name: 'Transactions' }).click()
    
    await page.getByPlaceholder('Search transactions').fill('Grocery')
    
    await expect(page.getByText('Grocery Store')).toBeVisible()
    await expect(page.getByText('Salary')).not.toBeVisible()
  })
})
```

```typescript
// e2e/tests/chat.spec.ts

import { test, expect } from '@playwright/test'

test.describe('AI Chat', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()
    
    await page.getByRole('link', { name: 'AI Chat' }).click()
  })
  
  test('sends message and receives response', async ({ page }) => {
    await page.getByPlaceholder('Ask about your finances...').fill(
      'What is my total balance?'
    )
    await page.getByRole('button', { name: 'Send' }).click()
    
    await expect(page.getByText('What is my total balance?')).toBeVisible()
    await expect(page.getByTestId('ai-response')).toBeVisible({ timeout: 10000 })
  })
  
  test('uploads file for analysis', async ({ page }) => {
    const fileInput = page.getByLabel('Upload file')
    await fileInput.setInputFiles('e2e/fixtures/test-statement.pdf')
    
    await expect(page.getByText('test-statement.pdf')).toBeVisible()
    await expect(page.getByText('Processing...')).toBeVisible()
    await expect(page.getByText('Analysis complete')).toBeVisible({ timeout: 30000 })
  })
})
```

## AI Response Testing

### AI Test Framework
```typescript
// server/src/__tests__/ai/ai-response.test.ts

import { VertexAIService } from '../../services/vertex-ai'

describe('AI Response Quality', () => {
  let service: VertexAIService
  
  beforeEach(() => {
    service = new VertexAIService()
  })
  
  describe('Financial Advice Quality', () => {
    it('provides specific, actionable advice', async () => {
      const response = await service.generateResponse(
        'user-123',
        'How can I save more money?',
        'budget'
      )
      
      // Check for specific numbers
      expect(response.content).toMatch(/\$[\d,]+/)
      
      // Check for actionable steps
      expect(response.content).toMatch(/consider|try|reduce|increase/i)
      
      // Check for reasoning
      expect(response.content).toMatch(/because|since|due to/i)
    })
    
    it('acknowledges limitations', async () => {
      const response = await service.generateResponse(
        'user-123',
        'Should I invest in cryptocurrency?',
        'investment'
      )
      
      // Should mention risk
      expect(response.content).toMatch(/risk|volatile|careful/i)
      
      // Should recommend professional advice
      expect(response.content).toMatch(/professional|advisor|consult/i)
    })
    
    it('uses user data in responses', async () => {
      const response = await service.generateResponse(
        'user-123',
        'What is my spending on food?',
        'spending'
      )
      
      // Should reference actual data
      expect(response.content).toMatch(/your|you/i)
      expect(response.content).toMatch(/\$[\d,]+/)
    })
  })
  
  describe('Document Analysis Quality', () => {
    it('extracts key information from documents', async () => {
      const response = await service.generateResponse(
        'user-123',
        'Analyze this bank statement',
        'document'
      )
      
      // Should identify document type
      expect(response.content).toMatch(/statement|bank|account/i)
      
      // Should extract amounts
      expect(response.content).toMatch(/\$[\d,]+/)
      
      // Should identify transactions
      expect(response.content).toMatch(/transaction|payment|deposit/i)
    })
  })
  
  describe('Error Handling', () => {
    it('handles missing data gracefully', async () => {
      const response = await service.generateResponse(
        'user-with-no-data',
        'What is my investment performance?',
        'investment'
      )
      
      expect(response.type).toBe('question')
      expect(response.content).toMatch(/no.*data|need.*information/i)
    })
    
    it('handles ambiguous queries', async () => {
      const response = await service.generateResponse(
        'user-123',
        'Help me',
        'general'
      )
      
      expect(response.type).toBe('question')
      expect(response.followUpQuestions).toBeDefined()
      expect(response.followUpQuestions.length).toBeGreaterThan(0)
    })
  })
})
```

### AI Response Validation
```typescript
// server/src/__tests__/ai/response-validator.test.ts

import { validateAIResponse } from '../../services/response-validator'

describe('AI Response Validator', () => {
  it('validates response structure', () => {
    const validResponse = {
      content: 'Test response',
      type: 'insight',
      confidence: 0.8
    }
    
    expect(() => validateAIResponse(validResponse)).not.toThrow()
  })
  
  it('rejects invalid response type', () => {
    const invalidResponse = {
      content: 'Test response',
      type: 'invalid',
      confidence: 0.8
    }
    
    expect(() => validateAIResponse(invalidResponse)).toThrow()
  })
  
  it('rejects invalid confidence score', () => {
    const invalidResponse = {
      content: 'Test response',
      type: 'insight',
      confidence: 1.5
    }
    
    expect(() => validateAIResponse(invalidResponse)).toThrow()
  })
  
  it('validates financial amounts', () => {
    const response = {
      content: 'You spent $1,234.56 on groceries',
      type: 'insight',
      confidence: 0.9
    }
    
    const validated = validateAIResponse(response)
    expect(validated.amounts).toContain(1234.56)
  })
})
```

## Performance Testing

### Load Testing
```typescript
// server/src/__tests__/performance/load.test.ts

import { check } from 'k6'
import http from 'k6/http'

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01']
  }
}

export default function () {
  const res = http.get('http://localhost:3001/api/transactions', {
    headers: {
      Authorization: `Bearer ${__ENV.AUTH_TOKEN}`
    }
  })
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  })
}
```

## Test Configuration

### Vitest Configuration
```typescript
// vitest.config.ts

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### Test Setup
```typescript
// client/src/test/setup.ts

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock
})
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml

name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run linter
        run: bun run lint
      
      - name: Run unit tests
        run: bun run test:unit
      
      - name: Run integration tests
        run: bun run test:integration
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Run E2E tests
        run: bun run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Test Reporting

### Coverage Report
```typescript
// package.json scripts

{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

---

**Status**: Draft
**Last Updated**: 2026-03-22
**Next Review**: Before implementation begins

## Overview
Comprehensive testing strategy for the financial dashboard, covering unit tests, integration tests, end-to-end tests, and AI response validation.

## Testing Philosophy

### Principles
1. **Test Early, Test Often**: Write tests as you develop features
2. **Test Pyramid**: Many unit tests, some integration tests, few E2E tests
3. **Test Behavior, Not Implementation**: Focus on what code does, not how
4. **Fast Feedback**: Tests should run quickly
5. **Reliable Tests**: Tests should be deterministic and not flaky

### Coverage Goals
- **Unit Tests**: 80% code coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows
- **AI Tests**: All AI response scenarios

## Testing Stack

### Frontend Testing
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "msw": "^2.0.0",
    "playwright": "^1.40.0"
  }
}
```

### Backend Testing
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^2.0.0",
    "nock": "^13.4.0"
  }
}
```

## Unit Testing

### Frontend Unit Tests

#### Component Testing
```typescript
// client/src/components/__tests__/TransactionList.test.tsx

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransactionList } from '../TransactionList'
import { useTransactions } from '@/hooks/useTransactions'

// Mock the hook
vi.mock('@/hooks/useTransactions')

describe('TransactionList', () => {
  const mockTransactions = [
    {
      id: '1',
      description: 'Grocery Store',
      amount: -50.00,
      date: '2024-01-15',
      category: { name: 'Food', color: '#ff0000' }
    },
    {
      id: '2',
      description: 'Salary',
      amount: 5000.00,
      date: '2024-01-01',
      category: { name: 'Income', color: '#00ff00' }
    }
  ]
  
  beforeEach(() => {
    vi.mocked(useTransactions).mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      error: null
    })
  })
  
  it('renders transaction list correctly', () => {
    render(<TransactionList />)
    
    expect(screen.getByText('Grocery Store')).toBeInTheDocument()
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByText('-$50.00')).toBeInTheDocument()
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
  })
  
  it('shows loading state', () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null
    })
    
    render(<TransactionList />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
  
  it('shows error state', () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch')
    })
    
    render(<TransactionList />)
    
    expect(screen.getByText(/error loading transactions/i)).toBeInTheDocument()
  })
  
  it('filters transactions by category', async () => {
    const user = userEvent.setup()
    render(<TransactionList />)
    
    const filterSelect = screen.getByLabelText(/filter by category/i)
    await user.selectOptions(filterSelect, 'Food')
    
    await waitFor(() => {
      expect(screen.getByText('Grocery Store')).toBeInTheDocument()
      expect(screen.queryByText('Salary')).not.toBeInTheDocument()
    })
  })
  
  it('sorts transactions by date', async () => {
    const user = userEvent.setup()
    render(<TransactionList />)
    
    const sortButton = screen.getByRole('button', { name: /sort by date/i })
    await user.click(sortButton)
    
    const transactions = screen.getAllByTestId('transaction-item')
    expect(transactions[0]).toHaveTextContent('Salary')
    expect(transactions[1]).toHaveTextContent('Grocery Store')
  })
})
```

#### Hook Testing
```typescript
// client/src/hooks/__tests__/useTransactions.test.ts

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTransactions } from '../useTransactions'
import { api } from '@/lib/api'

vi.mock('@/lib/api')

describe('useTransactions', () => {
  let queryClient: QueryClient
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false
        }
      }
    })
  })
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
  
  it('fetches transactions successfully', async () => {
    const mockTransactions = [
      { id: '1', description: 'Test', amount: 100 }
    ]
    
    vi.mocked(api.get).mockResolvedValue({ data: mockTransactions })
    
    const { result } = renderHook(() => useTransactions(), { wrapper })
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data).toEqual(mockTransactions)
    })
  })
  
  it('handles fetch error', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
    
    const { result } = renderHook(() => useTransactions(), { wrapper })
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBeInstanceOf(Error)
    })
  })
  
  it('refetches on interval', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] })
    
    const { result } = renderHook(
      () => useTransactions({ refetchInterval: 1000 }),
      { wrapper }
    )
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1)
    })
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2)
    }, { timeout: 2000 })
  })
})
```

#### Utility Testing
```typescript
// client/src/lib/__tests__/utils.test.ts

import { formatCurrency, formatDate, calculatePercentage } from '../utils'

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56')
  })
  
  it('formats EUR correctly', () => {
    expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56')
  })
  
  it('handles negative amounts', () => {
    expect(formatCurrency(-1234.56, 'USD')).toBe('-$1,234.56')
  })
  
  it('handles zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
  })
  
  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(1234.567, 'USD')).toBe('$1,234.57')
  })
})

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-15')
    expect(formatDate(date)).toBe('Jan 15, 2024')
  })
  
  it('handles different formats', () => {
    const date = new Date('2024-01-15')
    expect(formatDate(date, 'short')).toBe('1/15/24')
    expect(formatDate(date, 'long')).toBe('January 15, 2024')
  })
})

describe('calculatePercentage', () => {
  it('calculates percentage correctly', () => {
    expect(calculatePercentage(50, 200)).toBe(25)
  })
  
  it('handles zero total', () => {
    expect(calculatePercentage(50, 0)).toBe(0)
  })
  
  it('rounds to 1 decimal place', () => {
    expect(calculatePercentage(33, 100)).toBe(33)
    expect(calculatePercentage(33.333, 100)).toBe(33.3)
  })
})
```

### Backend Unit Tests

#### Service Testing
```typescript
// server/src/services/__tests__/vertex-ai.test.ts

import { VertexAIService } from '../vertex-ai'
import { buildContext } from '../context-builder'

vi.mock('../context-builder')
vi.mock('@google-cloud/aiplatform')

describe('VertexAIService', () => {
  let service: VertexAIService
  
  beforeEach(() => {
    service = new VertexAIService()
    vi.clearAllMocks()
  })
  
  describe('generateResponse', () => {
    it('generates response successfully', async () => {
      const mockContext = {
        userProfile: { name: 'Test User' },
        financialSummary: { totalBalance: 10000 }
      }
      
      vi.mocked(buildContext).mockResolvedValue(mockContext as any)
      
      const mockResponse = {
        predictions: [{ content: 'Test response' }]
      }
      
      vi.mocked(service.client.predict).mockResolvedValue([mockResponse])
      
      const result = await service.generateResponse(
        'user-123',
        'How much do I spend on food?',
        'spending'
      )
      
      expect(result.content).toBe('Test response')
      expect(result.type).toBe('insight')
    })
    
    it('handles rate limit error', async () => {
      vi.mocked(buildContext).mockResolvedValue({} as any)
      vi.mocked(service.client.predict).mockRejectedValue(
        new Error('Rate limit exceeded')
      )
      
      const result = await service.generateResponse(
        'user-123',
        'Test query',
        'spending'
      )
      
      expect(result.type).toBe('error')
      expect(result.content).toContain('high demand')
    })
    
    it('selects correct model based on complexity', async () => {
      vi.mocked(buildContext).mockResolvedValue({} as any)
      vi.mocked(service.client.predict).mockResolvedValue([
        { predictions: [{ content: 'Response' }] }
      ])
      
      // Simple query should use Flash
      await service.generateResponse(
        'user-123',
        'What is my balance?',
        'spending'
      )
      
      expect(service.client.predict).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: expect.stringContaining('gemini-2.5-flash')
        })
      )
      
      vi.clearAllMocks()
      
      // Complex query should use Pro
      await service.generateResponse(
        'user-123',
        'Analyze my spending patterns and suggest budget optimizations',
        'analysis'
      )
      
      expect(service.client.predict).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: expect.stringContaining('gemini-2.5-pro')
        })
      )
    })
  })
  
  describe('assessQueryComplexity', () => {
    it('returns low complexity for simple queries', () => {
      const complexity = service.assessQueryComplexity(
        'What is my balance?',
        'spending'
      )
      
      expect(complexity).toBeLessThan(0.6)
    })
    
    it('returns high complexity for analysis queries', () => {
      const complexity = service.assessQueryComplexity(
        'Analyze my spending patterns and suggest budget optimizations',
        'analysis'
      )
      
      expect(complexity).toBeGreaterThan(0.7)
    })
  })
})
```

#### Controller Testing
```typescript
// server/src/controllers/__tests__/transactions.test.ts

import request from 'supertest'
import { app } from '../../index'
import { supabase } from '../../services/supabase'

vi.mock('../../services/supabase')

describe('Transactions Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('GET /api/transactions', () => {
    it('returns transactions for authenticated user', async () => {
      const mockTransactions = [
        { id: '1', description: 'Test', amount: 100 }
      ]
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockTransactions,
          error: null
        })
      } as any)
      
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', 'Bearer valid-token')
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockTransactions)
    })
    
    it('returns 401 for unauthenticated user', async () => {
      const response = await request(app)
        .get('/api/transactions')
      
      expect(response.status).toBe(401)
    })
    
    it('handles database error', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error')
        })
      } as any)
      
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', 'Bearer valid-token')
      
      expect(response.status).toBe(500)
    })
  })
  
  describe('POST /api/transactions', () => {
    it('creates transaction successfully', async () => {
      const newTransaction = {
        description: 'New Transaction',
        amount: 100,
        date: '2024-01-15',
        category_id: 'cat-123'
      }
      
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [{ id: '1', ...newTransaction }],
          error: null
        })
      } as any)
      
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', 'Bearer valid-token')
        .send(newTransaction)
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
    })
    
    it('validates required fields', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', 'Bearer valid-token')
        .send({})
      
      expect(response.status).toBe(400)
      expect(response.body.errors).toBeDefined()
    })
  })
})
```

## Integration Testing

### API Integration Tests
```typescript
// server/src/__tests__/integration/transactions.integration.test.ts

import request from 'supertest'
import { app } from '../../index'
import { setupTestDatabase, teardownTestDatabase } from './test-db'

describe('Transactions Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })
  
  afterAll(async () => {
    await teardownTestDatabase()
  })
  
  describe('Full transaction flow', () => {
    let authToken: string
    let accountId: string
    
    it('creates account, adds transaction, and retrieves it', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
      
      authToken = loginResponse.body.token
      
      // Create account
      const accountResponse = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Bank',
          type: 'bank',
          currency: 'USD',
          balance: 1000
        })
      
      accountId = accountResponse.body.id
      
      // Create transaction
      const transactionResponse = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          account_id: accountId,
          description: 'Grocery Store',
          amount: -50,
          date: '2024-01-15',
          category_id: 'cat-food'
        })
      
      expect(transactionResponse.status).toBe(201)
      
      // Retrieve transactions
      const getResponse = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(getResponse.status).toBe(200)
      expect(getResponse.body).toHaveLength(1)
      expect(getResponse.body[0].description).toBe('Grocery Store')
    })
  })
})
```

### Database Integration Tests
```typescript
// server/src/__tests__/integration/database.integration.test.ts

import { supabase } from '../../services/supabase'

describe('Database Integration', () => {
  describe('Transactions CRUD', () => {
    let userId: string
    let transactionId: string
    
    beforeAll(async () => {
      // Create test user
      const { data: user } = await supabase
        .from('users')
        .insert({ email: 'test@example.com', name: 'Test User' })
        .select()
        .single()
      
      userId = user.id
    })
    
    afterAll(async () => {
      // Cleanup
      await supabase.from('transactions').delete().eq('user_id', userId)
      await supabase.from('users').delete().eq('id', userId)
    })
    
    it('creates transaction', async () => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          description: 'Test Transaction',
          amount: 100,
          date: '2024-01-15',
          type: 'expense'
        })
        .select()
        .single()
      
      expect(error).toBeNull()
      expect(data).toHaveProperty('id')
      transactionId = data.id
    })
    
    it('retrieves transaction', async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select()
        .eq('id', transactionId)
        .single()
      
      expect(error).toBeNull()
      expect(data.description).toBe('Test Transaction')
    })
    
    it('updates transaction', async () => {
      const { data, error } = await supabase
        .from('transactions')
        .update({ description: 'Updated Transaction' })
        .eq('id', transactionId)
        .select()
        .single()
      
      expect(error).toBeNull()
      expect(data.description).toBe('Updated Transaction')
    })
    
    it('deletes transaction', async () => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
      
      expect(error).toBeNull()
    })
  })
})
```

## End-to-End Testing

### E2E Test Setup
```typescript
// e2e/playwright.config.ts

import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
})
```

### Critical User Flow Tests
```typescript
// e2e/tests/onboarding.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test('completes onboarding successfully', async ({ page }) => {
    await page.goto('/')
    
    // Welcome screen
    await expect(page.getByText('Welcome to Financial Dashboard')).toBeVisible()
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Profile setup
    await expect(page.getByText('Set Up Your Profile')).toBeVisible()
    await page.getByLabel('Name').fill('Test User')
    await page.getByLabel('Company').fill('Test Company')
    await page.getByRole('button', { name: 'Next' }).click()
    
    // Currency selection
    await expect(page.getByText('Select Your Currency')).toBeVisible()
    await page.getByLabel('Currency').selectOption('USD')
    await page.getByRole('button', { name: 'Next' }).click()
    
    // Account connection
    await expect(page.getByText('Connect Your Accounts')).toBeVisible()
    await page.getByRole('button', { name: 'Add Bank Account' }).click()
    await page.getByLabel('Account Name').fill('Test Bank')
    await page.getByLabel('Balance').fill('1000')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    
    // AI introduction
    await expect(page.getByText('Meet Your AI Assistant')).toBeVisible()
    await page.getByRole('button', { name: 'Finish' }).click()
    
    // Dashboard
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Test Bank')).toBeVisible()
  })
  
  test('can skip onboarding', async ({ page }) => {
    await page.goto('/')
    
    await page.getByRole('button', { name: 'Skip' }).click()
    
    await expect(page.getByText('Dashboard')).toBeVisible()
  })
})
```

```typescript
// e2e/tests/transactions.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Transaction Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()
    
    await expect(page.getByText('Dashboard')).toBeVisible()
  })
  
  test('adds a new transaction', async ({ page }) => {
    await page.getByRole('link', { name: 'Transactions' }).click()
    await page.getByRole('button', { name: 'Add Transaction' }).click()
    
    await page.getByLabel('Description').fill('Grocery Store')
    await page.getByLabel('Amount').fill('50')
    await page.getByLabel('Date').fill('2024-01-15')
    await page.getByLabel('Category').selectOption('Food')
    await page.getByRole('button', { name: 'Save' }).click()
    
    await expect(page.getByText('Grocery Store')).toBeVisible()
    await expect(page.getByText('-$50.00')).toBeVisible()
  })
  
  test('filters transactions by category', async ({ page }) => {
    await page.getByRole('link', { name: 'Transactions' }).click()
    
    await page.getByLabel('Filter by Category').selectOption('Food')
    
    await expect(page.getByText('Grocery Store')).toBeVisible()
    await expect(page.getByText('Salary')).not.toBeVisible()
  })
  
  test('searches transactions', async ({ page }) => {
    await page.getByRole('link', { name: 'Transactions' }).click()
    
    await page.getByPlaceholder('Search transactions').fill('Grocery')
    
    await expect(page.getByText('Grocery Store')).toBeVisible()
    await expect(page.getByText('Salary')).not.toBeVisible()
  })
})
```

```typescript
// e2e/tests/chat.spec.ts

import { test, expect } from '@playwright/test'

test.describe('AI Chat', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()
    
    await page.getByRole('link', { name: 'AI Chat' }).click()
  })
  
  test('sends message and receives response', async ({ page }) => {
    await page.getByPlaceholder('Ask about your finances...').fill(
      'What is my total balance?'
    )
    await page.getByRole('button', { name: 'Send' }).click()
    
    await expect(page.getByText('What is my total balance?')).toBeVisible()
    await expect(page.getByTestId('ai-response')).toBeVisible({ timeout: 10000 })
  })
  
  test('uploads file for analysis', async ({ page }) => {
    const fileInput = page.getByLabel('Upload file')
    await fileInput.setInputFiles('e2e/fixtures/test-statement.pdf')
    
    await expect(page.getByText('test-statement.pdf')).toBeVisible()
    await expect(page.getByText('Processing...')).toBeVisible()
    await expect(page.getByText('Analysis complete')).toBeVisible({ timeout: 30000 })
  })
})
```

## AI Response Testing

### AI Test Framework
```typescript
// server/src/__tests__/ai/ai-response.test.ts

import { VertexAIService } from '../../services/vertex-ai'

describe('AI Response Quality', () => {
  let service: VertexAIService
  
  beforeEach(() => {
    service = new VertexAIService()
  })
  
  describe('Financial Advice Quality', () => {
    it('provides specific, actionable advice', async () => {
      const response = await service.generateResponse(
        'user-123',
        'How can I save more money?',
        'budget'
      )
      
      // Check for specific numbers
      expect(response.content).toMatch(/\$[\d,]+/)
      
      // Check for actionable steps
      expect(response.content).toMatch(/consider|try|reduce|increase/i)
      
      // Check for reasoning
      expect(response.content).toMatch(/because|since|due to/i)
    })
    
    it('acknowledges limitations', async () => {
      const response = await service.generateResponse(
        'user-123',
        'Should I invest in cryptocurrency?',
        'investment'
      )
      
      // Should mention risk
      expect(response.content).toMatch(/risk|volatile|careful/i)
      
      // Should recommend professional advice
      expect(response.content).toMatch(/professional|advisor|consult/i)
    })
    
    it('uses user data in responses', async () => {
      const response = await service.generateResponse(
        'user-123',
        'What is my spending on food?',
        'spending'
      )
      
      // Should reference actual data
      expect(response.content).toMatch(/your|you/i)
      expect(response.content).toMatch(/\$[\d,]+/)
    })
  })
  
  describe('Document Analysis Quality', () => {
    it('extracts key information from documents', async () => {
      const response = await service.generateResponse(
        'user-123',
        'Analyze this bank statement',
        'document'
      )
      
      // Should identify document type
      expect(response.content).toMatch(/statement|bank|account/i)
      
      // Should extract amounts
      expect(response.content).toMatch(/\$[\d,]+/)
      
      // Should identify transactions
      expect(response.content).toMatch(/transaction|payment|deposit/i)
    })
  })
  
  describe('Error Handling', () => {
    it('handles missing data gracefully', async () => {
      const response = await service.generateResponse(
        'user-with-no-data',
        'What is my investment performance?',
        'investment'
      )
      
      expect(response.type).toBe('question')
      expect(response.content).toMatch(/no.*data|need.*information/i)
    })
    
    it('handles ambiguous queries', async () => {
      const response = await service.generateResponse(
        'user-123',
        'Help me',
        'general'
      )
      
      expect(response.type).toBe('question')
      expect(response.followUpQuestions).toBeDefined()
      expect(response.followUpQuestions.length).toBeGreaterThan(0)
    })
  })
})
```

### AI Response Validation
```typescript
// server/src/__tests__/ai/response-validator.test.ts

import { validateAIResponse } from '../../services/response-validator'

describe('AI Response Validator', () => {
  it('validates response structure', () => {
    const validResponse = {
      content: 'Test response',
      type: 'insight',
      confidence: 0.8
    }
    
    expect(() => validateAIResponse(validResponse)).not.toThrow()
  })
  
  it('rejects invalid response type', () => {
    const invalidResponse = {
      content: 'Test response',
      type: 'invalid',
      confidence: 0.8
    }
    
    expect(() => validateAIResponse(invalidResponse)).toThrow()
  })
  
  it('rejects invalid confidence score', () => {
    const invalidResponse = {
      content: 'Test response',
      type: 'insight',
      confidence: 1.5
    }
    
    expect(() => validateAIResponse(invalidResponse)).toThrow()
  })
  
  it('validates financial amounts', () => {
    const response = {
      content: 'You spent $1,234.56 on groceries',
      type: 'insight',
      confidence: 0.9
    }
    
    const validated = validateAIResponse(response)
    expect(validated.amounts).toContain(1234.56)
  })
})
```

## Performance Testing

### Load Testing
```typescript
// server/src/__tests__/performance/load.test.ts

import { check } from 'k6'
import http from 'k6/http'

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01']
  }
}

export default function () {
  const res = http.get('http://localhost:3001/api/transactions', {
    headers: {
      Authorization: `Bearer ${__ENV.AUTH_TOKEN}`
    }
  })
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  })
}
```

## Test Configuration

### Vitest Configuration
```typescript
// vitest.config.ts

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### Test Setup
```typescript
// client/src/test/setup.ts

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock
})
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml

name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run linter
        run: bun run lint
      
      - name: Run unit tests
        run: bun run test:unit
      
      - name: Run integration tests
        run: bun run test:integration
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Run E2E tests
        run: bun run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Test Reporting

### Coverage Report
```typescript
// package.json scripts

{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

---

**Status**: Draft
**Last Updated**: 2026-03-22
**Next Review**: Before implementation begins

