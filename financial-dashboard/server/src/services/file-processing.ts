import pdf from 'pdf-parse';
import { parse } from 'csv-parse';
import * as XLSX from 'xlsx';

export interface ExtractedContent {
  text: string;
  pages?: number;
  metadata?: any;
  type: 'text' | 'ocr';
  confidence?: number;
}

export interface ExtractedData {
  records: any[];
  columns: string[];
  rowCount: number;
  sheetNames?: string[];
}

export interface BankStatement {
  bankId?: string;
  accountId?: string;
  accountType?: string;
  balance?: number;
  transactions: {
    date: Date;
    amount: number;
    description: string;
    type: string;
    fitId?: string;
  }[];
}

export class FileProcessingService {
  // PDF Extraction
  async extractPDF(buffer: Buffer): Promise<ExtractedContent> {
    try {
      const data = await pdf(buffer);
      
      if (data.text.length > 100) {
        return {
          text: data.text,
          pages: data.numpages,
          metadata: data.info,
          type: 'text'
        };
      }
      
      // If little text, might be scanned PDF
      return {
        text: data.text,
        pages: data.numpages,
        type: 'text',
        confidence: 0.5
      };
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  // CSV Extraction
  async extractCSV(buffer: Buffer): Promise<ExtractedData> {
    return new Promise((resolve, reject) => {
      const records: any[] = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: true
      });
      
      parser.on('readable', () => {
        let record;
        while ((record = parser.read()) !== null) {
          records.push(record);
        }
      });
      
      parser.on('error', reject);
      parser.on('end', () => {
        resolve({
          records,
          columns: Object.keys(records[0] || {}),
          rowCount: records.length
        });
      });
      
      parser.write(buffer.toString());
      parser.end();
    });
  }

  // Excel Extraction
  async extractExcel(buffer: Buffer): Promise<ExtractedData> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const records = XLSX.utils.sheet_to_json(sheet);
    
    return {
      records,
      columns: Object.keys(records[0] || {}),
      rowCount: records.length,
      sheetNames: workbook.SheetNames
    };
  }

  // Parse bank statement CSV/Excel
  async parseBankStatement(data: ExtractedData): Promise<BankStatement> {
    const transactions: BankStatement['transactions'] = [];
    
    for (const record of data.records) {
      // Try to identify common column names
      const date = this.parseDate(
        record.Date || record.date || record['Transaction Date'] || record['Date']
      );
      
      const amount = this.parseAmount(
        record.Amount || record.amount || record['Transaction Amount'] || record.Amount
      );
      
      const description = 
        record.Description || record.description || record['Transaction Description'] || 
        record.Payee || record.payee || record.Memo || record.memo || '';
      
      const type = this.determineTransactionType(amount, record);
      
      if (date && !isNaN(amount)) {
        transactions.push({
          date,
          amount: Math.abs(amount),
          description,
          type,
          fitId: record['Reference'] || record['Transaction ID'] || undefined
        });
      }
    }
    
    return {
      transactions
    };
  }

  // AI-powered document analysis
  async analyzeDocument(text: string): Promise<any> {
    // This will be called by the Vertex AI service
    // to analyze extracted document text
    const analysis = {
      documentType: this.detectDocumentType(text),
      keyData: this.extractKeyData(text),
      transactions: this.extractTransactionsFromText(text),
      summary: this.generateSummary(text)
    };
    
    return analysis;
  }

  private parseDate(dateValue: any): Date | null {
    if (!dateValue) return null;
    
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }

  private parseAmount(amountValue: any): number {
    if (typeof amountValue === 'number') return amountValue;
    if (typeof amountValue === 'string') {
      // Remove currency symbols and commas
      const cleaned = amountValue.replace(/[$,]/g, '');
      return parseFloat(cleaned);
    }
    return 0;
  }

  private determineTransactionType(amount: number, record: any): string {
    // Check for explicit type column
    const type = record.Type || record.type || record['Transaction Type'];
    if (type) {
      const typeStr = String(type).toLowerCase();
      if (typeStr.includes('debit') || typeStr.includes('withdrawal')) return 'expense';
      if (typeStr.includes('credit') || typeStr.includes('deposit')) return 'income';
    }
    
    // Determine from amount sign
    return amount < 0 ? 'expense' : 'income';
  }

  private detectDocumentType(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('bank statement') || lowerText.includes('account summary')) {
      return 'bank_statement';
    }
    if (lowerText.includes('invoice') || lowerText.includes('bill to')) {
      return 'invoice';
    }
    if (lowerText.includes('receipt') || lowerText.includes('thank you for your purchase')) {
      return 'receipt';
    }
    if (lowerText.includes('tax') || lowerText.includes('irs') || lowerText.includes('form 10')) {
      return 'tax_document';
    }
    
    return 'unknown';
  }

  private extractKeyData(text: string): any {
    const data: any = {};
    
    // Extract amounts (look for currency patterns)
    const amountMatches = text.match(/\$[\d,]+\.?\d*/g);
    if (amountMatches) {
      data.amounts = amountMatches.map(a => parseFloat(a.replace(/[$,]/g, '')));
    }
    
    // Extract dates
    const dateMatches = text.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g);
    if (dateMatches) {
      data.dates = dateMatches;
    }
    
    // Extract email addresses
    const emailMatches = text.match(/[\w.-]+@[\w.-]+\.\w+/g);
    if (emailMatches) {
      data.emails = emailMatches;
    }
    
    return data;
  }

  private extractTransactionsFromText(text: string): any[] {
    const transactions = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Look for patterns like: Date Description Amount
      const match = line.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(.+?)\s+([\$\d,\.]+)/);
      if (match) {
        transactions.push({
          date: match[1],
          description: match[2].trim(),
          amount: parseFloat(match[3].replace(/[$,]/g, ''))
        });
      }
    }
    
    return transactions;
  }

  private generateSummary(text: string): string {
    // Simple summary generation
    const lines = text.split('\n').filter(l => l.trim());
    const wordCount = text.split(/\s+/).length;
    
    return `Document contains ${lines.length} lines and approximately ${wordCount} words.`;
  }
}

export const fileProcessingService = new FileProcessingService();
