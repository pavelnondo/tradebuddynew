require('dotenv').config();
const { Pool } = require('pg');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

class CSVHandler {
  constructor() {
    this.pool = new Pool({
      host: process.env.PGHOST || 'localhost',
      user: process.env.PGUSER || 'tradebuddy_user',
      password: process.env.PGPASSWORD || 'your_db_password_here',
      database: process.env.PGDATABASE || 'tradebuddy',
      port: process.env.PGPORT || 5432,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  // Export trades to CSV
  async exportTradesToCSV() {
    try {
      const result = await this.pool.query(`
        SELECT 
          id,
          symbol,
          type,
          entry_price,
          exit_price,
          quantity,
          entry_time,
          exit_time,
          pnl,
          notes,
          emotion,
          setup,
          execution_quality,
          duration,
          checklist_id,
          checklist_completed,
          screenshot
        FROM trades 
        ORDER BY entry_time DESC
      `);

      if (result.rows.length === 0) {
        throw new Error('No trades found to export');
      }

      const csvWriter = createCsvWriter({
        path: path.join(__dirname, '../exports/trades_export.csv'),
        header: [
          { id: 'id', title: 'ID' },
          { id: 'symbol', title: 'Symbol' },
          { id: 'type', title: 'Type' },
          { id: 'entry_price', title: 'Entry Price' },
          { id: 'exit_price', title: 'Exit Price' },
          { id: 'quantity', title: 'Quantity' },
          { id: 'entry_time', title: 'Entry Time' },
          { id: 'exit_time', title: 'Exit Time' },
          { id: 'pnl', title: 'P&L' },
          { id: 'notes', title: 'Notes' },
          { id: 'emotion', title: 'Emotion' },
          { id: 'setup', title: 'Setup' },
          { id: 'execution_quality', title: 'Execution Quality' },
          { id: 'duration', title: 'Duration' },
          { id: 'checklist_id', title: 'Checklist ID' },
          { id: 'checklist_completed', title: 'Checklist Completed' },
          { id: 'screenshot', title: 'Screenshot' }
        ]
      });

      await csvWriter.writeRecords(result.rows);
      
      return {
        filePath: path.join(__dirname, '../exports/trades_export.csv'),
        recordCount: result.rows.length,
        fileName: `trades_export_${new Date().toISOString().split('T')[0]}.csv`
      };
    } catch (error) {
      console.error('CSV export error:', error);
      throw error;
    }
  }

  // Import trades from CSV
  async importTradesFromCSV(filePath) {
    try {
      const trades = [];
      
      return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
            // Clean and validate the data
            const trade = {
              symbol: row.Symbol || row.symbol,
              type: row.Type || row.type,
              entry_price: parseFloat(row['Entry Price'] || row.entry_price) || 0,
              exit_price: parseFloat(row['Exit Price'] || row.exit_price) || 0,
              quantity: parseInt(row.Quantity || row.quantity) || 0,
              entry_time: row['Entry Time'] || row.entry_time || new Date().toISOString(),
              exit_time: row['Exit Time'] || row.exit_time || new Date().toISOString(),
              pnl: parseFloat(row['P&L'] || row.pnl) || 0,
              notes: row.Notes || row.notes || '',
              emotion: row.Emotion || row.emotion || '',
              setup: row.Setup || row.setup || '',
              execution_quality: row['Execution Quality'] || row.execution_quality || '',
              duration: row.Duration || row.duration || '',
              checklist_id: row['Checklist ID'] || row.checklist_id || null,
              checklist_completed: row['Checklist Completed'] || row.checklist_completed || null,
              screenshot: row.Screenshot || row.screenshot || ''
            };

            // Validate required fields
            if (trade.symbol && trade.type && trade.entry_price && trade.quantity) {
              trades.push(trade);
            }
          })
          .on('end', async () => {
            try {
              if (trades.length === 0) {
                reject(new Error('No valid trades found in CSV file'));
                return;
              }

              // Insert trades into database
              const insertedTrades = [];
              for (const trade of trades) {
                const result = await this.pool.query(`
                  INSERT INTO trades (
                    symbol, type, entry_price, exit_price, quantity, 
                    entry_time, exit_time, pnl, notes, emotion, 
                    setup, execution_quality, duration, checklist_id, 
                    checklist_completed, screenshot
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                  RETURNING id
                `, [
                  trade.symbol, trade.type, trade.entry_price, trade.exit_price, trade.quantity,
                  trade.entry_time, trade.exit_time, trade.pnl, trade.notes, trade.emotion,
                  trade.setup, trade.execution_quality, trade.duration, trade.checklist_id,
                  trade.checklist_completed, trade.screenshot
                ]);
                
                insertedTrades.push(result.rows[0].id);
              }

              resolve({
                imported: insertedTrades.length,
                total: trades.length,
                tradeIds: insertedTrades
              });
            } catch (error) {
              reject(error);
            }
          })
          .on('error', (error) => {
            reject(error);
          });
      });
    } catch (error) {
      console.error('CSV import error:', error);
      throw error;
    }
  }

  // Generate CSV template for users
  generateCSVTemplate() {
    const templateData = [
      {
        symbol: 'AAPL',
        type: 'LONG',
        entry_price: 150.50,
        exit_price: 155.00,
        quantity: 100,
        entry_time: '2024-01-15T09:30:00Z',
        exit_time: '2024-01-15T15:30:00Z',
        pnl: 450.00,
        notes: 'Breakout trade on earnings',
        emotion: 'Confident',
        setup: 'Breakout',
        execution_quality: 'A',
        duration: '6h',
        checklist_id: 1,
        checklist_completed: 'true',
        screenshot: ''
      }
    ];

    const csvWriter = createCsvWriter({
      path: path.join(__dirname, '../exports/trades_template.csv'),
      header: [
        { id: 'symbol', title: 'Symbol' },
        { id: 'type', title: 'Type' },
        { id: 'entry_price', title: 'Entry Price' },
        { id: 'exit_price', title: 'Exit Price' },
        { id: 'quantity', title: 'Quantity' },
        { id: 'entry_time', title: 'Entry Time' },
        { id: 'exit_time', title: 'Exit Time' },
        { id: 'pnl', title: 'P&L' },
        { id: 'notes', title: 'Notes' },
        { id: 'emotion', title: 'Emotion' },
        { id: 'setup', title: 'Setup' },
        { id: 'execution_quality', title: 'Execution Quality' },
        { id: 'duration', title: 'Duration' },
        { id: 'checklist_id', title: 'Checklist ID' },
        { id: 'checklist_completed', title: 'Checklist Completed' },
        { id: 'screenshot', title: 'Screenshot' }
      ]
    });

    return csvWriter.writeRecords(templateData);
  }

  // Validate CSV format
  validateCSVFormat(filePath) {
    return new Promise((resolve, reject) => {
      const requiredColumns = ['Symbol', 'Type', 'Entry Price', 'Quantity'];
      const foundColumns = [];
      let isValid = true;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headers) => {
          foundColumns.push(...headers);
        })
        .on('data', (row) => {
          // Check if required columns exist
          requiredColumns.forEach(col => {
            if (!foundColumns.includes(col)) {
              isValid = false;
            }
          });
        })
        .on('end', () => {
          resolve({
            isValid,
            foundColumns,
            missingColumns: requiredColumns.filter(col => !foundColumns.includes(col))
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  // Get export statistics
  async getExportStats() {
    try {
      const result = await this.pool.query(`
        SELECT 
          COUNT(*) as total_trades,
          COUNT(CASE WHEN pnl > 0 THEN 1 END) as winning_trades,
          COUNT(CASE WHEN pnl < 0 THEN 1 END) as losing_trades,
          SUM(pnl) as total_pnl,
          AVG(pnl) as avg_pnl,
          MIN(entry_time) as first_trade,
          MAX(entry_time) as last_trade
        FROM trades
      `);

      const stats = result.rows[0];
      const winRate = stats.total_trades > 0 ? (stats.winning_trades / stats.total_trades * 100).toFixed(1) : 0;

      return {
        totalTrades: stats.total_trades,
        winRate: `${winRate}%`,
        totalPnl: `$${stats.total_pnl?.toFixed(2) || '0.00'}`,
        avgPnl: `$${stats.avg_pnl?.toFixed(2) || '0.00'}`,
        firstTrade: stats.first_trade,
        lastTrade: stats.last_trade,
        dateRange: stats.first_trade && stats.last_trade ? 
          `${new Date(stats.first_trade).toLocaleDateString()} - ${new Date(stats.last_trade).toLocaleDateString()}` : 
          'N/A'
      };
    } catch (error) {
      console.error('Export stats error:', error);
      throw error;
    }
  }
}

module.exports = CSVHandler; 