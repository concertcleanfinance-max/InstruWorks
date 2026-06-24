import React, { useState, useEffect } from 'react';
import { Wrench, Package, FileText, Database, ShieldCheck, Link2 } from 'lucide-react';
import RepairsPage from './components/RepairsPage';
import InventoryPage from './components/InventoryPage';
import InvoicesPage from './components/InvoicesPage';

// Seed initial data if localStorage is empty
const INITIAL_REPAIRS = [
  {
    id: 'REP-1001',
    client: {
      name: 'Sarah Jenkins',
      phone: '0412 345 678',
      email: 'sarah.jenkins@gmail.com'
    },
    instrument: {
      category: 'Woodwind',
      type: 'Alto Saxophone',
      make: 'Yamaha',
      model: 'YAS-280',
      serialNumber: 'YAS280-554210'
    },
    issues: ['Sticky G# key', 'Pads leaking on low Bb', 'Neck cork worn'],
    notes: 'Checked leaks with leak light. Replaced G# pad and neck cork. Leaks resolved.',
    status: 'Ready for Pickup',
    estimatedCost: 195.00,
    partsUsed: [
      { id: 'PROD-1004', sku: 'CORK-N-1.6', name: 'Saxophone Neck Cork Sheet 1.6mm', price: 8.00, qty: 1 }
    ],
    laborHours: 2.5,
    laborRate: 75.00,
    createdAt: '2026-06-05T10:30:00Z',
    invoiceId: 'INV-1001'
  },
  {
    id: 'REP-1002',
    client: {
      name: 'Michael Chang',
      phone: '0488 765 432',
      email: 'mchang.brass@outlook.com'
    },
    instrument: {
      category: 'Brass',
      type: 'Bb Trumpet',
      make: 'Bach',
      model: 'Stradivarius 37',
      serialNumber: 'ML-564319'
    },
    issues: ['1st valve sticky', 'Minor dent in bell', 'Waterkey leaking cork'],
    notes: 'Dents need careful rolling. Cleaned valve casing and aligned 1st valve guide.',
    status: 'In Progress',
    estimatedCost: 260.00,
    partsUsed: [
      { id: 'PROD-1005', sku: 'CORK-W-TR', name: 'Trumpet Waterkey Corks (5pk)', price: 5.00, qty: 1 }
    ],
    laborHours: 3.0,
    laborRate: 75.00,
    createdAt: '2026-06-07T14:15:00Z'
  },
  {
    id: 'REP-1003',
    client: {
      name: 'Emma Watson',
      phone: '0409 111 222',
      email: 'emma.clarinets@yahoo.com'
    },
    instrument: {
      category: 'Woodwind',
      type: 'Bb Clarinet',
      make: 'Buffet Crampon',
      model: 'E11',
      serialNumber: 'BC-998432'
    },
    issues: ['Tenon joint cork loose', 'Upper joint pads sticky'],
    notes: 'Awaiting tenon cork sheets. Clarinet is disassembled and cleaned.',
    status: 'Awaiting Parts',
    estimatedCost: 120.00,
    partsUsed: [],
    laborHours: 1.5,
    laborRate: 75.00,
    createdAt: '2026-06-08T09:00:00Z'
  },
  {
    id: 'REP-1004',
    client: {
      name: 'David Gilmour',
      phone: '0450 999 888',
      email: 'dg.pink@music.co.uk'
    },
    instrument: {
      category: 'Brass',
      type: 'Double French Horn',
      make: 'Conn',
      model: '8D Connstellation',
      serialNumber: 'CN-8D-44321'
    },
    issues: ['Rotary valves sluggish', 'Rotor cord broken on 2nd valve'],
    notes: 'Needs ultrasonic clean and complete restringing of all rotary valves.',
    status: 'Received',
    estimatedCost: 350.00,
    partsUsed: [],
    laborHours: 0,
    laborRate: 75.00,
    createdAt: '2026-06-09T16:40:00Z'
  }
];

const INITIAL_INVENTORY = [
  { id: 'PROD-1001', sku: 'OIL-VALVE-Y', name: 'Yamaha Valve Oil (Regular)', category: 'Key/Valve Oil', price: 15.00, stock: 4, reorderPoint: 5 },
  { id: 'PROD-1002', sku: 'REED-AS-2.5', name: 'Rico Alto Sax Reeds (2.5) - Box 10', category: 'Reeds', price: 38.00, stock: 12, reorderPoint: 3 },
  { id: 'PROD-1003', sku: 'MP-CLAR-B45', name: 'Vandoren B45 Bb Clarinet Mouthpiece', category: 'Mouthpieces', price: 145.00, stock: 2, reorderPoint: 1 },
  { id: 'PROD-1004', sku: 'CORK-N-1.6', name: 'Saxophone Neck Cork Sheet 1.6mm', category: 'Parts', price: 8.00, stock: 14, reorderPoint: 5 },
  { id: 'PROD-1005', sku: 'CORK-W-TR', name: 'Trumpet Waterkey Corks (5pk)', category: 'Parts', price: 5.00, stock: 19, reorderPoint: 5 },
  { id: 'PROD-1006', sku: 'OIL-KEY-HD', name: 'Key Oil Heavy Duty (Fast-acting)', category: 'Key/Valve Oil', price: 12.00, stock: 1, reorderPoint: 3 }
];

const INITIAL_INVOICES = [
  {
    id: 'INV-1001',
    repairJobId: 'REP-1001',
    client: {
      name: 'Sarah Jenkins',
      phone: '0412 345 678',
      email: 'sarah.jenkins@gmail.com'
    },
    lineItems: [
      { description: 'Labor - Alto Saxophone Neck Cork & Pad Repair (2.5 hrs)', qty: 1, unitPrice: 187.50, xeroAccountCode: '400' },
      { description: 'Parts - Saxophone Neck Cork Sheet 1.6mm', qty: 1, unitPrice: 8.00, xeroAccountCode: '420' }
    ],
    subtotal: 195.50,
    tax: 19.55,
    total: 215.05,
    xeroSyncStatus: 'synced',
    xeroInvoiceId: 'INV-XERO-998822',
    syncedAt: '2026-06-06T11:00:00Z'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('repairs');
  
  // App States
  const [repairs, setRepairs] = useState(() => {
    const local = localStorage.getItem('ww_repairs');
    return local ? JSON.parse(local) : INITIAL_REPAIRS;
  });

  const [inventory, setInventory] = useState(() => {
    const local = localStorage.getItem('ww_inventory');
    return local ? JSON.parse(local) : INITIAL_INVENTORY;
  });

  const [invoices, setInvoices] = useState(() => {
    const local = localStorage.getItem('ww_invoices');
    return local ? JSON.parse(local) : INITIAL_INVOICES;
  });

  const [xeroConnected, setXeroConnected] = useState(() => {
    const local = localStorage.getItem('ww_xero_conn');
    return local ? JSON.parse(local) : true;
  });

  // Sync back to LocalStorage
  useEffect(() => {
    localStorage.setItem('ww_repairs', JSON.stringify(repairs));
  }, [repairs]);

  useEffect(() => {
    localStorage.setItem('ww_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('ww_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('ww_xero_conn', JSON.stringify(xeroConnected));
  }, [xeroConnected]);

  // Utility to handle status updates & inventory triggers
  const handleUpdateRepairStatus = (repairId, newStatus) => {
    setRepairs(prevRepairs => prevRepairs.map(rep => {
      if (rep.id === repairId) {
        // If transitioning to Invoiced/Completed, and no invoice exists, trigger creation
        return { ...rep, status: newStatus };
      }
      return rep;
    }));
  };

  const handleSaveRepair = (updatedRepair) => {
    setRepairs(prevRepairs => {
      const exists = prevRepairs.some(r => r.id === updatedRepair.id);
      if (exists) {
        return prevRepairs.map(r => r.id === updatedRepair.id ? updatedRepair : r);
      } else {
        return [updatedRepair, ...prevRepairs];
      }
    });
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="brand-section">
            <div className="brand-logo">🎷</div>
            <div className="brand-info">
              <h1>Brass & Wood</h1>
              <p>Workshop Console</p>
            </div>
          </div>
          
          <nav>
            <ul className="nav-links">
              <li>
                <button 
                  className={`nav-item ${activeTab === 'repairs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('repairs')}
                >
                  <Wrench size={18} />
                  Repair Board
                </button>
              </li>
              <li>
                <button 
                  className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
                  onClick={() => setActiveTab('inventory')}
                >
                  <Package size={18} />
                  Stock Catalog
                </button>
              </li>
              <li>
                <button 
                  className={`nav-item ${activeTab === 'invoices' ? 'active' : ''}`}
                  onClick={() => setActiveTab('invoices')}
                >
                  <FileText size={18} />
                  Invoicing Console
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="xero-connection-status">
            <div className={`status-indicator ${xeroConnected ? 'connected' : ''}`}></div>
            <div className="flex-grow">
              <span className="text-muted" style={{ display: 'block', fontSize: '10px' }}>INTEGRATION</span>
              <strong>{xeroConnected ? 'Connected to Xero' : 'Xero Offline'}</strong>
            </div>
            <button 
              onClick={() => setXeroConnected(!xeroConnected)} 
              className="btn btn-secondary" 
              style={{ padding: '4px 8px', fontSize: '10px' }}
              title="Toggle Xero integration status"
            >
              <Link2 size={12} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <h2>
              {activeTab === 'repairs' && 'Repair Intake & Workflow Board'}
              {activeTab === 'inventory' && 'Inventory Catalog & Sales'}
              {activeTab === 'invoices' && 'Invoicing & Xero Sync'}
            </h2>
          </div>
          <div className="header-actions">
            <span className="text-muted" style={{ fontSize: '12px' }}>
              Local Time: {new Date().toLocaleDateString('en-AU', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </header>

        <div className="page-container">
          {activeTab === 'repairs' && (
            <RepairsPage 
              repairs={repairs} 
              inventory={inventory}
              setInventory={setInventory}
              onSaveRepair={handleSaveRepair}
              onUpdateStatus={handleUpdateRepairStatus}
              onGenerateInvoice={(repair) => {
                // Pre-generate invoice in invoice screen and navigate
                const subtotal = (repair.laborHours * repair.laborRate) + repair.partsUsed.reduce((sum, p) => sum + (p.price * p.qty), 0);
                const tax = subtotal * 0.10; // GST 10%
                
                const laborLine = {
                  description: `Labor - ${repair.instrument.make} ${repair.instrument.type} (${repair.laborHours} hrs)`,
                  qty: 1,
                  unitPrice: repair.laborHours * repair.laborRate,
                  xeroAccountCode: '400' // Labor account code
                };

                const partsLines = repair.partsUsed.map(p => ({
                  description: `Parts - ${p.name}`,
                  qty: p.qty,
                  unitPrice: p.price,
                  xeroAccountCode: '420' // Parts account code
                }));

                const newInvoice = {
                  id: `INV-${Date.now().toString().slice(-4)}`,
                  repairJobId: repair.id,
                  client: repair.client,
                  lineItems: [laborLine, ...partsLines],
                  subtotal: parseFloat(subtotal.toFixed(2)),
                  tax: parseFloat(tax.toFixed(2)),
                  total: parseFloat((subtotal + tax).toFixed(2)),
                  xeroSyncStatus: 'unsynced'
                };

                // Add to invoices state
                setInvoices(prev => [newInvoice, ...prev]);
                
                // Link repair with invoice ID
                setRepairs(prev => prev.map(r => r.id === repair.id ? { ...r, invoiceId: newInvoice.id, status: 'Ready for Pickup' } : r));
                
                // Switch tab
                setActiveTab('invoices');
              }}
            />
          )}
          
          {activeTab === 'inventory' && (
            <InventoryPage 
              inventory={inventory} 
              setInventory={setInventory}
              onLogSale={(product, quantity) => {
                // Deduct stock
                setInventory(prev => prev.map(p => p.id === product.id ? { ...p, stock: Math.max(0, p.stock - quantity) } : p));
                
                // Generate instant checkout invoice
                const subtotal = product.price * quantity;
                const tax = subtotal * 0.10;
                
                const newInvoice = {
                  id: `INV-${Date.now().toString().slice(-4)}`,
                  client: {
                    name: 'Over-the-Counter Customer',
                    phone: '-',
                    email: '-'
                  },
                  lineItems: [
                    {
                      description: `Retail Sale - ${product.name}`,
                      qty: quantity,
                      unitPrice: product.price,
                      xeroAccountCode: '420'
                    }
                  ],
                  subtotal: parseFloat(subtotal.toFixed(2)),
                  tax: parseFloat(tax.toFixed(2)),
                  total: parseFloat((subtotal + tax).toFixed(2)),
                  xeroSyncStatus: 'unsynced'
                };

                setInvoices(prev => [newInvoice, ...prev]);
                alert(`Direct sale completed! Deducted ${quantity}x from ${product.name}. Invoice generated: ${newInvoice.id}`);
              }}
            />
          )}
          
          {activeTab === 'invoices' && (
            <InvoicesPage 
              invoices={invoices} 
              setInvoices={setInvoices} 
              xeroConnected={xeroConnected}
              repairs={repairs}
            />
          )}
        </div>
      </main>
    </div>
  );
}
