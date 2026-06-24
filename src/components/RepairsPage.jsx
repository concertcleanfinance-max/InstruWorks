import React, { useState } from 'react';
import { Plus, Search, User, Hammer, AlertCircle, CheckCircle, ClipboardList, Trash2 } from 'lucide-react';

const STATUS_COLUMNS = [
  { key: 'Received', label: 'Received', color: 'status-received' },
  { key: 'Under Inspection', label: 'Inspection', color: 'status-inspection' },
  { key: 'Awaiting Parts', label: 'Awaiting Parts', color: 'status-parts' },
  { key: 'In Progress', label: 'In Progress', color: 'status-progress' },
  { key: 'Testing', label: 'Testing', color: 'status-testing' },
  { key: 'Ready for Pickup', label: 'Ready', color: 'status-ready' }
];

export default function RepairsPage({ repairs, inventory, setInventory, onSaveRepair, onUpdateStatus, onGenerateInvoice }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState('All');
  
  // Modals state
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('details');

  // Intake Form State
  const [intakeForm, setIntakeForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    category: 'Woodwind',
    type: 'Alto Saxophone',
    make: '',
    model: '',
    serialNumber: '',
    issues: '',
    notes: '',
    laborHours: 1,
    laborRate: 75
  });

  // Edit/Detail States for selected repair
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editLaborHours, setEditLaborHours] = useState(0);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
  const [productAddQty, setProductAddQty] = useState(1);

  // Filter & Search
  const filteredRepairs = repairs.filter(rep => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      rep.id.toLowerCase().includes(searchLower) ||
      rep.client.name.toLowerCase().includes(searchLower) ||
      rep.instrument.make.toLowerCase().includes(searchLower) ||
      rep.instrument.model.toLowerCase().includes(searchLower) ||
      rep.instrument.serialNumber.toLowerCase().includes(searchLower);

    const matchesFilter = instrumentFilter === 'All' || rep.instrument.category === instrumentFilter;
    return matchesSearch && matchesFilter;
  });

  const handleOpenDetails = (repair) => {
    setSelectedRepair(repair);
    setEditNotes(repair.notes || '');
    setEditStatus(repair.status);
    setEditLaborHours(repair.laborHours || 0);
    setActiveModalTab('details');
  };

  const handleCloseDetails = () => {
    setSelectedRepair(null);
  };

  const handleIntakeSubmit = (e) => {
    e.preventDefault();
    const newId = `REP-${Date.now().toString().slice(-4)}`;
    const newRepair = {
      id: newId,
      client: {
        name: intakeForm.clientName,
        phone: intakeForm.clientPhone,
        email: intakeForm.clientEmail
      },
      instrument: {
        category: intakeForm.category,
        type: intakeForm.type,
        make: intakeForm.make,
        model: intakeForm.model,
        serialNumber: intakeForm.serialNumber
      },
      issues: intakeForm.issues.split('\n').filter(i => i.trim() !== ''),
      notes: intakeForm.notes,
      status: 'Received',
      estimatedCost: 75.00 * intakeForm.laborHours,
      partsUsed: [],
      laborHours: parseFloat(intakeForm.laborHours) || 0,
      laborRate: parseFloat(intakeForm.laborRate) || 75.00,
      createdAt: new Date().toISOString()
    };

    onSaveRepair(newRepair);
    setIsIntakeOpen(false);
    // Reset form
    setIntakeForm({
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      category: 'Woodwind',
      type: 'Alto Saxophone',
      make: '',
      model: '',
      serialNumber: '',
      issues: '',
      notes: '',
      laborHours: 1,
      laborRate: 75
    });
  };

  // Add parts to repair job
  const handleAddPart = () => {
    if (!selectedProductToAdd) return;
    const product = inventory.find(p => p.id === selectedProductToAdd);
    if (!product) return;

    if (product.stock < productAddQty) {
      alert(`Cannot add part: Only ${product.stock} available in inventory.`);
      return;
    }

    // Deduct stock from inventory
    setInventory(prevInventory => prevInventory.map(p => {
      if (p.id === product.id) {
        return { ...p, stock: p.stock - productAddQty };
      }
      return p;
    }));

    // Add part to repair job details
    const updatedParts = [...(selectedRepair.partsUsed || [])];
    const existingPartIndex = updatedParts.findIndex(p => p.id === product.id);

    if (existingPartIndex > -1) {
      updatedParts[existingPartIndex].qty += productAddQty;
    } else {
      updatedParts.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        qty: productAddQty
      });
    }

    const updatedRepair = {
      ...selectedRepair,
      partsUsed: updatedParts
    };

    onSaveRepair(updatedRepair);
    setSelectedRepair(updatedRepair);
    setSelectedProductToAdd('');
    setProductAddQty(1);
  };

  const handleRemovePart = (partId, qty) => {
    // Return stock to inventory
    setInventory(prevInventory => prevInventory.map(p => {
      if (p.id === partId) {
        return { ...p, stock: p.stock + qty };
      }
      return p;
    }));

    // Remove from repair
    const updatedParts = selectedRepair.partsUsed.filter(p => p.id !== partId);
    const updatedRepair = {
      ...selectedRepair,
      partsUsed: updatedParts
    };

    onSaveRepair(updatedRepair);
    setSelectedRepair(updatedRepair);
  };

  const handleSaveDetailsUpdates = () => {
    const updatedRepair = {
      ...selectedRepair,
      notes: editNotes,
      status: editStatus,
      laborHours: parseFloat(editLaborHours) || 0
    };
    onSaveRepair(updatedRepair);
    setSelectedRepair(updatedRepair);
    alert('Details and labor hours saved.');
  };

  // Render stats counters
  const totalRepairs = repairs.length;
  const inProgressCount = repairs.filter(r => r.status === 'In Progress').length;
  const readyCount = repairs.filter(r => r.status === 'Ready for Pickup').length;
  const awaitingCount = repairs.filter(r => r.status === 'Awaiting Parts').length;

  return (
    <div>
      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#dfc28c' }}><ClipboardList size={20} /></div>
          <div>
            <div className="stat-label">Total Repairs</div>
            <div className="stat-number">{totalRepairs}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#fbbf24' }}><Hammer size={20} /></div>
          <div>
            <div className="stat-label">In Progress</div>
            <div className="stat-number">{inProgressCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#f87171' }}><AlertCircle size={20} /></div>
          <div>
            <div className="stat-label">Awaiting Parts</div>
            <div className="stat-number">{awaitingCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#34d399' }}><CheckCircle size={20} /></div>
          <div>
            <div className="stat-label">Ready for Pickup</div>
            <div className="stat-number">{readyCount}</div>
          </div>
        </div>
      </div>

      {/* Header controls */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flexGrow: 1, maxWidth: '600px' }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <input 
                type="text" 
                placeholder="Search serial number, customer, brand, model..." 
                className="input-control" 
                style={{ width: '100%', paddingLeft: '40px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={16} className="text-muted" style={{ position: 'absolute', left: '14px', top: '15px' }} />
            </div>
            <select 
              className="input-control"
              value={instrumentFilter}
              onChange={(e) => setInstrumentFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Woodwind">Woodwinds</option>
              <option value="Brass">Brass</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setIsIntakeOpen(true)}>
            <Plus size={16} /> Instrument Intake
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {STATUS_COLUMNS.map(col => {
          const columnRepairs = filteredRepairs.filter(rep => rep.status === col.key);
          return (
            <div className="kanban-column" key={col.key}>
              <div className="kanban-column-header">
                <span className={`kanban-column-title ${col.color}`}>
                  {col.label}
                </span>
                <span className="kanban-column-count">{columnRepairs.length}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', minHeight: '350px' }}>
                {columnRepairs.map(rep => (
                  <div 
                    className="repair-card" 
                    key={rep.id} 
                    onClick={() => handleOpenDetails(rep)}
                  >
                    <div className="flex-space" style={{ marginBottom: '6px' }}>
                      <span className={`repair-card-tag ${rep.instrument.category === 'Brass' ? 'tag-brass' : 'tag-woodwind'}`}>
                        {rep.instrument.type}
                      </span>
                      <span className="text-muted" style={{ fontSize: '10px', fontWeight: 'bold' }}>{rep.id}</span>
                    </div>
                    <div className="repair-card-title">
                      {rep.instrument.make} {rep.instrument.model}
                    </div>
                    <div className="repair-card-client">
                      <User size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      {rep.client.name}
                    </div>
                    
                    {rep.issues && rep.issues.length > 0 && (
                      <div className="text-muted" style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        ⚠ {rep.issues[0]}
                      </div>
                    )}

                    <div className="repair-card-meta">
                      <span>Est: ${rep.estimatedCost.toFixed(2)}</span>
                      <span className="status-badge" style={{ fontSize: '9px', padding: '1px 6px' }}>
                        {rep.partsUsed?.length > 0 ? `${rep.partsUsed.length} parts` : 'no parts'}
                      </span>
                    </div>
                  </div>
                ))}
                
                {columnRepairs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                    No items in this step
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* INTAKE MODAL */}
      {isIntakeOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>New Instrument Intake Form</h3>
              <button className="close-btn" onClick={() => setIsIntakeOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleIntakeSubmit}>
              <div className="modal-body">
                <h4 className="text-gold" style={{ fontFamily: 'var(--font-serif)', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>1. Client Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Client Name</label>
                    <input 
                      type="text" 
                      required 
                      className="input-control" 
                      placeholder="e.g. John Doe"
                      value={intakeForm.clientName}
                      onChange={(e) => setIntakeForm({...intakeForm, clientName: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                      type="text" 
                      required 
                      className="input-control" 
                      placeholder="e.g. 0400 000 000"
                      value={intakeForm.clientPhone}
                      onChange={(e) => setIntakeForm({...intakeForm, clientPhone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className="input-control" 
                    placeholder="e.g. john.doe@email.com"
                    value={intakeForm.clientEmail}
                    onChange={(e) => setIntakeForm({...intakeForm, clientEmail: e.target.value})}
                  />
                </div>

                <h4 className="text-gold" style={{ fontFamily: 'var(--font-serif)', marginTop: '20px', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>2. Instrument & Repair Details</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select 
                      className="input-control"
                      value={intakeForm.category}
                      onChange={(e) => setIntakeForm({...intakeForm, category: e.target.value})}
                    >
                      <option value="Woodwind">Woodwind</option>
                      <option value="Brass">Brass</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Instrument Type</label>
                    <input 
                      type="text" 
                      required 
                      className="input-control" 
                      placeholder="e.g. Tenor Sax, Trumpet, Flute"
                      value={intakeForm.type}
                      onChange={(e) => setIntakeForm({...intakeForm, type: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Make / Brand</label>
                    <input 
                      type="text" 
                      required 
                      className="input-control" 
                      placeholder="e.g. Yamaha, Selmer, Bach"
                      value={intakeForm.make}
                      onChange={(e) => setIntakeForm({...intakeForm, make: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Model Name / Number</label>
                    <input 
                      type="text" 
                      required 
                      className="input-control" 
                      placeholder="e.g. YAS-280, Stradivarius 37"
                      value={intakeForm.model}
                      onChange={(e) => setIntakeForm({...intakeForm, model: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Serial Number</label>
                    <input 
                      type="text" 
                      required 
                      className="input-control" 
                      placeholder="e.g. SN-998822"
                      value={intakeForm.serialNumber}
                      onChange={(e) => setIntakeForm({...intakeForm, serialNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Reported Issues (One per line)</label>
                  <textarea 
                    rows="3" 
                    required 
                    className="input-control" 
                    placeholder="e.g. Pad sticky&#10;Key bent&#10;Waterkey leaking"
                    value={intakeForm.issues}
                    onChange={(e) => setIntakeForm({...intakeForm, issues: e.target.value})}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Technician Initial Notes / Diagnostic</label>
                  <textarea 
                    rows="2" 
                    className="input-control" 
                    placeholder="Enter diagnostic details..."
                    value={intakeForm.notes}
                    onChange={(e) => setIntakeForm({...intakeForm, notes: e.target.value})}
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Initial Est. Labor Hours</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      required 
                      className="input-control" 
                      value={intakeForm.laborHours}
                      onChange={(e) => setIntakeForm({...intakeForm, laborHours: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Labor Rate ($/hr)</label>
                    <input 
                      type="number" 
                      required 
                      className="input-control" 
                      value={intakeForm.laborRate}
                      onChange={(e) => setIntakeForm({...intakeForm, laborRate: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsIntakeOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save & Register Instrument</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL / EDIT MODAL */}
      {selectedRepair && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div>
                <span className="text-muted" style={{ fontSize: '11px', display: 'block' }}>REPAIR WORK ORDER</span>
                <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  {selectedRepair.id}: {selectedRepair.instrument.make} {selectedRepair.instrument.model} 
                  <span className={`status-badge ${selectedRepair.status === 'Ready for Pickup' ? 'status-ready' : 'status-progress'}`} style={{ fontSize: '11px' }}>
                    {selectedRepair.status}
                  </span>
                </h3>
              </div>
              <button className="close-btn" onClick={handleCloseDetails}>&times;</button>
            </div>

            <div className="modal-tabs">
              <button 
                className={`modal-tab ${activeModalTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('details')}
              >
                Intake & Status
              </button>
              <button 
                className={`modal-tab ${activeModalTab === 'parts' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('parts')}
              >
                Parts & Labor
              </button>
            </div>

            <div className="modal-body">
              {activeModalTab === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="grid-2">
                    <div className="card" style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)' }}>
                      <h4 className="text-gold" style={{ marginBottom: '8px', fontSize: '14px' }}>Client Info</h4>
                      <p><strong>Name:</strong> {selectedRepair.client.name}</p>
                      <p><strong>Phone:</strong> {selectedRepair.client.phone}</p>
                      <p><strong>Email:</strong> {selectedRepair.client.email}</p>
                    </div>
                    <div className="card" style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)' }}>
                      <h4 className="text-gold" style={{ marginBottom: '8px', fontSize: '14px' }}>Instrument Info</h4>
                      <p><strong>Category:</strong> {selectedRepair.instrument.category}</p>
                      <p><strong>Type:</strong> {selectedRepair.instrument.type}</p>
                      <p><strong>Make/Model:</strong> {selectedRepair.instrument.make} - {selectedRepair.instrument.model}</p>
                      <p><strong>Serial:</strong> {selectedRepair.instrument.serialNumber}</p>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)' }}>
                    <h4 className="text-gold" style={{ marginBottom: '8px', fontSize: '14px' }}>Reported Client Issues</h4>
                    <ul style={{ paddingLeft: '20px', fontSize: '13px' }}>
                      {selectedRepair.issues.map((issue, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{issue}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="form-group">
                    <label>Technician Service Notes</label>
                    <textarea 
                      className="input-control" 
                      rows="3" 
                      placeholder="Add diagnostic outcome, repair steps, leak reports..."
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Update Workflow Status</label>
                      <select 
                        className="input-control"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        <option value="Received">Received</option>
                        <option value="Under Inspection">Under Inspection</option>
                        <option value="Awaiting Parts">Awaiting Parts</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Testing">Testing</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Actual Labor Hours</label>
                      <input 
                        type="number" 
                        step="0.25" 
                        className="input-control" 
                        value={editLaborHours}
                        onChange={(e) => setEditLaborHours(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button type="button" className="btn btn-secondary" onClick={handleSaveDetailsUpdates}>
                      Save Progress Notes
                    </button>
                  </div>
                </div>
              )}

              {activeModalTab === 'parts' && (
                <div>
                  <h4 className="text-gold" style={{ marginBottom: '12px' }}>Inventory Parts Logged</h4>
                  
                  {selectedRepair.partsUsed && selectedRepair.partsUsed.length > 0 ? (
                    <div className="table-container" style={{ marginBottom: '20px' }}>
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>SKU</th>
                            <th>Part Name</th>
                            <th>Price</th>
                            <th>Qty Used</th>
                            <th>Total</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRepair.partsUsed.map(part => (
                            <tr key={part.id}>
                              <td><code>{part.sku}</code></td>
                              <td>{part.name}</td>
                              <td>${part.price.toFixed(2)}</td>
                              <td>{part.qty}</td>
                              <td>${(part.price * part.qty).toFixed(2)}</td>
                              <td>
                                <button 
                                  type="button" 
                                  className="btn btn-danger" 
                                  style={{ padding: '4px 8px' }}
                                  onClick={() => handleRemovePart(part.id, part.qty)}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="card" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                      No inventory parts logged for this job yet.
                    </div>
                  )}

                  <div className="card" style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', border: '1px dashed var(--border-gold)' }}>
                    <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Add Part From Stock</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Select Product</label>
                        <select 
                          className="input-control"
                          value={selectedProductToAdd}
                          onChange={(e) => setSelectedProductToAdd(e.target.value)}
                        >
                          <option value="">-- Choose Stock Item --</option>
                          {inventory.map(prod => (
                            <option key={prod.id} value={prod.id} disabled={prod.stock <= 0}>
                              {prod.name} (SKU: {prod.sku}) - ${prod.price} | Stock: {prod.stock}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Quantity</label>
                        <input 
                          type="number" 
                          min="1" 
                          className="input-control" 
                          value={productAddQty}
                          onChange={(e) => setProductAddQty(parseInt(e.target.value) || 1)}
                        />
                      </div>

                      <button type="button" className="btn btn-primary" onClick={handleAddPart}>
                        Log Part
                      </button>
                    </div>
                  </div>

                  <div className="card" style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="flex-space" style={{ fontSize: '15px' }}>
                      <span>Labor: {selectedRepair.laborHours} hrs @ ${selectedRepair.laborRate}/hr</span>
                      <strong>Subtotal Labor: ${(selectedRepair.laborHours * selectedRepair.laborRate).toFixed(2)}</strong>
                    </div>
                    <div className="flex-space" style={{ fontSize: '15px', marginTop: '6px' }}>
                      <span>Parts Cost:</span>
                      <strong>Subtotal Parts: ${(selectedRepair.partsUsed?.reduce((sum, p) => sum + (p.price * p.qty), 0) || 0).toFixed(2)}</strong>
                    </div>
                    <hr style={{ border: 0, borderBottom: '1px solid var(--border-subtle)', margin: '12px 0' }} />
                    <div className="flex-space" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      <span className="text-gold">Total Estimated Bill:</span>
                      <span className="text-gold">
                        ${((selectedRepair.laborHours * selectedRepair.laborRate) + 
                          (selectedRepair.partsUsed?.reduce((sum, p) => sum + (p.price * p.qty), 0) || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                {!selectedRepair.invoiceId ? (
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => {
                      onGenerateInvoice(selectedRepair);
                      handleCloseDetails();
                    }}
                  >
                    Generate & Send Invoice
                  </button>
                ) : (
                  <span className="text-muted" style={{ fontSize: '12px' }}>
                    ✔ Invoiced (ID: {selectedRepair.invoiceId})
                  </span>
                )}
              </div>
              <div>
                <button type="button" className="btn btn-secondary" onClick={handleCloseDetails}>Close View</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
