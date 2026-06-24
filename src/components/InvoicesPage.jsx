import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Eye, Send, Play } from 'lucide-react';

export default function InvoicesPage({ invoices, setInvoices, xeroConnected, repairs }) {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  // Helper to generate Xero Compliant JSON Payload
  const generateXeroPayload = (inv) => {
    if (!inv) return '';
    
    return JSON.stringify({
      Invoices: [
        {
          Type: "ACCREC",
          Contact: {
            Name: inv.client.name,
            EmailAddress: inv.client.email || "",
            Phones: inv.client.phone ? [{ PhoneType: "DEFAULT", PhoneNumber: inv.client.phone }] : []
          },
          Date: new Date(inv.id.includes('INV-') ? Date.now() : inv.repairJobId ? Date.now() - 86400000 : Date.now()).toISOString().split('T')[0],
          DueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days net
          LineAmountTypes: "Exclusive",
          LineItems: inv.lineItems.map(item => ({
            Description: item.description,
            Quantity: item.qty,
            UnitAmount: item.unitPrice,
            AccountCode: item.xeroAccountCode || "400", // 400 sales/labor, 420 products
            TaxType: "OUTPUT" // Standard GST on Sales
          })),
          Status: "AUTHORISED", // Automatically approve in Xero
          Reference: inv.repairJobId ? `Repair Job ${inv.repairJobId}` : "Retail Counter Sale"
        }
      ]
    }, null, 2);
  };

  const handleSelectInvoice = (inv) => {
    setSelectedInvoice(inv);
    setSyncLogs([]);
  };

  // Simulate OAuth connection and API POST request
  const handleSyncToXero = async (inv) => {
    if (!xeroConnected) {
      alert("Xero Connection Offline! Please toggle the Xero connection active in the sidebar.");
      return;
    }

    setIsSyncing(true);
    setSyncLogs([
      { type: 'info', text: 'Initiating Xero sync sequence...' },
      { type: 'info', text: `Authenticating OAuth token for company tenant...` }
    ]);

    // Delay 500ms
    await new Promise(r => setTimeout(r, 600));
    setSyncLogs(prev => [
      ...prev,
      { type: 'info', text: `Verifying Contact details for "${inv.client.name}"...` }
    ]);

    // Delay 500ms
    await new Promise(r => setTimeout(r, 500));
    setSyncLogs(prev => [
      ...prev,
      { type: 'success', text: `Contact found/created: Xero ID: CON-992384` },
      { type: 'info', text: `POSTing invoice payload to: https://api.xero.com/api.xro/2.0/Invoices` }
    ]);

    // Delay 700ms
    await new Promise(r => setTimeout(r, 700));
    
    // Success chance 95%
    const mockXeroInvoiceId = `INV-XERO-${Math.floor(100000 + Math.random() * 900000)}`;
    
    setInvoices(prevInvoices => prevInvoices.map(invoice => {
      if (invoice.id === inv.id) {
        return {
          ...invoice,
          xeroSyncStatus: 'synced',
          xeroInvoiceId: mockXeroInvoiceId,
          syncedAt: new Date().toISOString()
        };
      }
      return invoice;
    }));

    // Update active view
    setSelectedInvoice(prev => ({
      ...prev,
      xeroSyncStatus: 'synced',
      xeroInvoiceId: mockXeroInvoiceId,
      syncedAt: new Date().toISOString()
    }));

    setSyncLogs(prev => [
      ...prev,
      { type: 'success', text: `Invoice parsed and accepted in Xero account.` },
      { type: 'success', text: `Response Status: 201 Created` },
      { type: 'success', text: `Xero Invoice ID assigned: ${mockXeroInvoiceId}` },
      { type: 'info', text: `Sync completed successfully at ${new Date().toLocaleTimeString()}` }
    ]);
    setIsSyncing(false);
  };

  return (
    <div>
      <div className="xero-console">
        {/* Invoice Queue List */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', marginBottom: '16px' }}>Invoice Registry</h3>
          
          <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Client</th>
                  <th>Job Type</th>
                  <th>Total Due</th>
                  <th>Xero Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr 
                    key={inv.id} 
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: selectedInvoice?.id === inv.id ? 'var(--bg-tertiary)' : 'transparent',
                      borderLeft: selectedInvoice?.id === inv.id ? '3px solid var(--accent-gold)' : 'none'
                    }}
                    onClick={() => handleSelectInvoice(inv)}
                  >
                    <td><strong>{inv.id}</strong></td>
                    <td>{inv.client.name}</td>
                    <td style={{ fontSize: '12px' }}>
                      {inv.repairJobId ? `Repair (${inv.repairJobId})` : 'Retail Sale'}
                    </td>
                    <td>${inv.total.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${inv.xeroSyncStatus === 'synced' ? 'status-ready' : 'status-progress'}`}>
                        {inv.xeroSyncStatus === 'synced' ? 'Synced' : 'Ready to Sync'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px' }}
                        title="Preview Print Invoice"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewInvoice(inv);
                        }}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Integration Console Detail view */}
        <div className="xero-sync-panel">
          {selectedInvoice ? (
            <div className="card">
              <div className="flex-space" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <span className="text-muted" style={{ fontSize: '11px', display: 'block' }}>SELECTED TRANSACTION</span>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px' }}>
                    {selectedInvoice.id} - {selectedInvoice.client.name}
                  </h4>
                </div>
                <span className={`status-badge ${selectedInvoice.xeroSyncStatus === 'synced' ? 'status-ready' : 'status-progress'}`}>
                  {selectedInvoice.xeroSyncStatus === 'synced' ? 'Synced' : 'Unsynced'}
                </span>
              </div>

              {/* Sync Actions */}
              {selectedInvoice.xeroSyncStatus === 'unsynced' ? (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    This invoice hasn't been pushed to Xero yet. Click below to post the JSON payload to the Xero API endpoint.
                  </p>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%' }}
                    onClick={() => handleSyncToXero(selectedInvoice)}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw size={16} className="mr-8" style={{ animation: 'spin 1s linear infinite' }} />
                        Pushing to Xero API...
                      </>
                    ) : (
                      <>
                        <Send size={16} className="mr-8" />
                        Sync to Xero
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="card" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)', padding: '14px', marginBottom: '20px' }}>
                  <div className="flex-align" style={{ color: '#34d399', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <CheckCircle2 size={16} /> Connected & Synced with Xero
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <strong>Xero Invoice Code:</strong> <code>{selectedInvoice.xeroInvoiceId}</code><br />
                    <strong>Synced At:</strong> {new Date(selectedInvoice.syncedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Xero API Payload Inspector Tab */}
              <div style={{ marginBottom: '12px' }}>
                <span className="text-muted" style={{ fontSize: '11px', display: 'block', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Xero API Request Payload
                </span>
                <div className="xero-payload-preview">
                  {generateXeroPayload(selectedInvoice)}
                </div>
              </div>

              {/* Console Logs */}
              {syncLogs.length > 0 && (
                <div>
                  <span className="text-muted" style={{ fontSize: '11px', display: 'block', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Sync Console Logs
                  </span>
                  <div style={{ 
                    backgroundColor: '#0a0b0d', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '12px', 
                    fontSize: '11px', 
                    fontFamily: 'monospace',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {syncLogs.map((log, idx) => (
                      <div key={idx} style={{ color: log.type === 'success' ? '#34d399' : log.type === 'error' ? '#f87171' : 'var(--text-secondary)' }}>
                        {log.type === 'success' ? '✔' : 'ℹ'} {log.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <RefreshCw size={36} style={{ margin: '0 auto 12px', color: 'var(--border-gold)' }} />
              <h4>Select an invoice from the queue to view Xero integration details and payload records.</h4>
            </div>
          )}
        </div>
      </div>

      {/* PRINT PREVIEW DIALOG MODAL */}
      {previewInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', backgroundColor: '#fff', color: '#1a1a1a' }}>
            <div className="modal-header" style={{ borderColor: '#e5e7eb' }}>
              <h3 style={{ color: '#111' }}>Tax Invoice Preview</h3>
              <button className="close-btn" style={{ color: '#6b7280' }} onClick={() => setPreviewInvoice(null)}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ padding: '32px', fontFamily: 'system-ui, sans-serif' }}>
              <div className="flex-space" style={{ alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ fontFamily: 'Georgia, serif', color: '#d4af37', fontSize: '28px', margin: 0 }}>Brass & Woodwind Co.</h2>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    128 Artisan Lane, Melbourne VIC 3000<br />
                    ABN: 45 998 112 004 | info@brasswoodwind.com.au
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', color: '#374151', margin: 0 }}>INVOICE</h1>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    <strong>Invoice #:</strong> {previewInvoice.id}<br />
                    <strong>Date:</strong> {new Date().toLocaleDateString()}<br />
                    <strong>Due Date:</strong> {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div style={{ borderTop: '2px solid #374151', padding: '16px 0', marginBottom: '24px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', display: 'block' }}>BILLED TO</span>
                <strong style={{ fontSize: '16px', color: '#111827' }}>{previewInvoice.client.name}</strong>
                <p style={{ fontSize: '12px', color: '#4b5563', margin: 0 }}>
                  Phone: {previewInvoice.client.phone}<br />
                  Email: {previewInvoice.client.email}
                </p>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #d1d5db', textAlign: 'left' }}>
                    <th style={{ padding: '8px 0', color: '#4b5563' }}>Description</th>
                    <th style={{ padding: '8px 0', color: '#4b5563', textAlign: 'center', width: '60px' }}>Qty</th>
                    <th style={{ padding: '8px 0', color: '#4b5563', textAlign: 'right', width: '90px' }}>Unit Price</th>
                    <th style={{ padding: '8px 0', color: '#4b5563', textAlign: 'right', width: '90px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {previewInvoice.lineItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 0', color: '#1f2937' }}>{item.description}</td>
                      <td style={{ padding: '10px 0', textAlign: 'center', color: '#4b5563' }}>{item.qty}</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', color: '#4b5563' }}>${item.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '500', color: '#111827' }}>${(item.qty * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals panel */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '14px' }}>
                <div style={{ width: '220px' }}>
                  <div className="flex-space" style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#4b5563' }}>Subtotal:</span>
                    <span style={{ color: '#111827' }}>${previewInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex-space" style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#4b5563' }}>GST (10%):</span>
                    <span style={{ color: '#111827' }}>${previewInvoice.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex-space" style={{ padding: '10px 0', fontWeight: 'bold', fontSize: '16px' }}>
                    <span style={{ color: '#111827' }}>Total Due:</span>
                    <span style={{ color: '#d4af37' }}>${previewInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {previewInvoice.xeroInvoiceId && (
                <div style={{ marginTop: '30px', padding: '12px', border: '1px dashed #10b981', backgroundColor: '#ecfdf5', borderRadius: '4px', textAlign: 'center' }}>
                  <span style={{ color: '#065f46', fontSize: '12px', fontWeight: '500' }}>
                    ✔ Synced with Xero (Reference Code: {previewInvoice.xeroInvoiceId})
                  </span>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
              <button className="btn btn-secondary" style={{ backgroundColor: '#fff', color: '#374151', borderColor: '#d1d5db' }} onClick={() => window.print()}>
                Print Invoice
              </button>
              <button className="btn btn-primary" style={{ backgroundColor: '#374151', color: '#fff' }} onClick={() => setPreviewInvoice(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
