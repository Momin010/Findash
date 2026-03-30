import { VertexAI } from '@google-cloud/vertexai';
import { supabaseAdmin } from '../lib/supabase';

// Model configurations
const PRO_CONFIG = {
  model: 'gemini-2.5-pro',
  temperature: 0.3,
  maxOutputTokens: 8192,
  topP: 0.8,
  topK: 40
};

const FLASH_CONFIG = {
  model: 'gemini-2.5-flash',
  temperature: 0.4,
  maxOutputTokens: 4096,
  topP: 0.9,
  topK: 40
};

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT || '',
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
});

interface FinancialContext {
  userProfile: any;
  accounts: any[];
  recentTransactions: any[];
  budgets: any[];
  investments: any[];
  financialSummary: any;
  chatHistory: any[];
}

interface AIResponse {
  content: string;
  tokensUsed: number;
  model: string;
  insights?: any[];
}

// System prompt for financial advisor
const SYSTEM_PROMPT = `You are an expert financial advisor AI assistant for a personalized financial dashboard. Your role is to help users understand their finances, provide actionable insights, and support better financial decision-making.

## Your Capabilities
- Analyze spending patterns and trends
- Provide budget optimization recommendations
- Offer investment insights and suggestions
- Help with tax planning and optimization
- Analyze uploaded financial documents
- Answer questions about financial data
- Create financial projections and forecasts

## Guidelines
1. Always base recommendations on the user's actual financial data
2. Be specific and actionable in your advice
3. Consider the user's financial goals and preferences
4. Explain your reasoning clearly
5. Highlight both opportunities and risks
6. Use the user's preferred currency for all amounts
7. Be conservative with investment advice - emphasize diversification
8. For tax advice, recommend consulting a professional for complex situations
9. Never make up financial data - only use provided context
10. If you need more information, ask clarifying questions

## Response Format
- Use clear, concise language
- Structure complex advice with bullet points or numbered lists
- Include specific numbers and percentages when relevant
- Provide actionable next steps
- Use markdown formatting for readability`;

export class VertexAIService {
  private generativeModel = vertexAI.getGenerativeModel({
    model: PRO_CONFIG.model,
  });

  async generateResponse(
    userId: string,
    query: string,
    sessionId?: string
  ): Promise<AIResponse> {
    try {
      // Build financial context
      const context = await this.buildContext(userId, query);
      
      // Select model based on query complexity
      const modelConfig = this.selectModel(query);
      
      // Format context for Gemini
      const formattedContext = this.formatContextForGemini(context);
      
      // Build chat history
      const chatHistory = await this.buildChatHistory(userId, sessionId);
      
      // Create chat
      const chat = this.generativeModel.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: modelConfig.maxOutputTokens,
          temperature: modelConfig.temperature,
          topP: modelConfig.topP,
          topK: modelConfig.topK,
        },
      });

      // Send message with context
      const prompt = `${SYSTEM_PROMPT}\n\n${formattedContext}\n\nUser Query: ${query}`;
      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      const content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract insights from response
      const insights = this.extractInsights(content);
      
      return {
        content,
        tokensUsed: response.usageMetadata?.totalTokenCount || 0,
        model: modelConfig.model,
        insights
      };
    } catch (error) {
      console.error('Vertex AI Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private async buildContext(userId: string, query: string): Promise<FinancialContext> {
    // Fetch user data in parallel
    const [
      userProfile,
      accounts,
      recentTransactions,
      budgets,
      investments
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*').eq('id', userId).single(),
      supabaseAdmin.from('accounts').select('*').eq('user_id', userId).eq('is_active', true),
      supabaseAdmin.from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false })
        .limit(30),
      supabaseAdmin.from('budgets')
        .select('*, category:categories(*)')
        .eq('user_id', userId)
        .eq('is_active', true),
      supabaseAdmin.from('investments')
        .select('*')
        .eq('user_id', userId)
    ]);

    // Calculate financial summary
    const financialSummary = this.calculateFinancialSummary(
      accounts.data || [],
      recentTransactions.data || []
    );

    return {
      userProfile: userProfile.data,
      accounts: accounts.data || [],
      recentTransactions: recentTransactions.data || [],
      budgets: budgets.data || [],
      investments: investments.data || [],
      financialSummary,
      chatHistory: []
    };
  }

  private calculateFinancialSummary(accounts: any[], transactions: any[]) {
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    
    const monthlyIncome = transactions
      .filter((t: any) => t.transaction_type === 'income')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const monthlyExpenses = transactions
      .filter((t: any) => t.transaction_type === 'expense')
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
    
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savingsRate
    };
  }

  private selectModel(query: string) {
    // Simple complexity detection
    const complexKeywords = ['analyze', 'recommend', 'strategy', 'projection', 'forecast', 'optimize'];
    const isComplex = complexKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
    
    return isComplex ? PRO_CONFIG : FLASH_CONFIG;
  }

  private formatContextForGemini(context: FinancialContext): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: context.userProfile?.base_currency || 'USD'
      }).format(amount);
    };

    return `
## User Profile
- Name: ${context.userProfile?.name || 'User'}
- Company: ${context.userProfile?.company_name || 'N/A'}
- Currency: ${context.userProfile?.base_currency || 'USD'}

## Financial Summary
- Total Balance: ${formatCurrency(context.financialSummary.totalBalance)}
- Monthly Income: ${formatCurrency(context.financialSummary.monthlyIncome)}
- Monthly Expenses: ${formatCurrency(context.financialSummary.monthlyExpenses)}
- Savings Rate: ${context.financialSummary.savingsRate.toFixed(1)}%

## Accounts
${context.accounts.map((acc: any) => `
- ${acc.name} (${acc.type}): ${formatCurrency(acc.balance)} ${acc.currency}
`).join('')}

## Recent Transactions (Last 30 Days)
${context.recentTransactions.slice(0, 20).map((tx: any) => `
- ${tx.transaction_date}: ${tx.description} - ${formatCurrency(tx.amount)} (${tx.category?.name || 'Uncategorized'})
`).join('')}

## Active Budgets
${context.budgets.map((budget: any) => `
- ${budget.name}: ${formatCurrency(budget.amount)} budgeted
`).join('')}

## Investments
${context.investments.map((inv: any) => `
- ${inv.name} (${inv.symbol}): ${inv.quantity} units @ ${formatCurrency(inv.current_price || inv.avg_cost_basis)}
`).join('')}
`;
  }

  private async buildChatHistory(userId: string, sessionId?: string): Promise<any[]> {
    if (!sessionId) return [];

    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (!messages) return [];

    return messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
  }

  private extractInsights(content: string): any[] {
    const insights = [];
    
    // Look for patterns like "Insight:" or "Recommendation:"
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('insight:') || 
          line.toLowerCase().includes('recommendation:') ||
          line.toLowerCase().includes('suggestion:')) {
        insights.push({
          type: 'insight',
          content: line.replace(/^(Insight|Recommendation|Suggestion):\s*/i, '').trim()
        });
      }
    }
    
    return insights;
  }
}

export const vertexAIService = new VertexAIService();
