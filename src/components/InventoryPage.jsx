import React, { useState } from 'react';
import { Plus, Search, AlertTriangle, ShoppingBag, Edit, Trash2 } from 'lucide-react';

export default function InventoryPage({ inventory, setInventory, onLogSale }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State
  const [productForm, setProductForm] = useState({
    sku: '',
    name: '',
    category: 'Key/Valve Oil',
    price: 10,
    stock: 10,
    reorderPoint: 3
  });

  // OTC (Over the counter) Quick Sale State
  const [otcProductId, setOtcProductId] = useState('');
  const [otcQty, setOtcQty] = useState(1);

  // Low Stock Detection
  const lowStockItems = inventory.filter(item => item.stock <= item.reorderPoint);

  const filteredInventory = inventory.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      item.sku.toLowerCase().includes(searchLower) ||
      item.name.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower);

    const matchesFilter = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesFilter;
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      // Edit mode
      setInventory(prev => prev.map(p => p.id === editingProduct.id ? {
        ...p,
        sku: productForm.sku,
        name: productForm.name,
        category: productForm.category,
        price: parseFloat(productForm.price) || 0,
        stock: parseInt(productForm.stock) || 0,
        reorderPoint: parseInt(productForm.reorderPoint) || 0
      } : p));
      setEditingProduct(null);
    } else {
      // Add mode
      const newProduct = {
        id: `PROD-${Date.now().toString().slice(-4)}`,
        sku: productForm.sku,
        name: productForm.name,
        category: productForm.category,
        price: parseFloat(productForm.price) || 0,
        stock: parseInt(productForm.stock) || 0,
        reorderPoint: parseInt(productForm.reorderPoint) || 0
      };
      setInventory(prev => [newProduct, ...prev]);
    }
    setIsAddOpen(false);
    resetForm();
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setProductForm({
      sku: product.sku,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      reorderPoint: product.reorderPoint
    });
    setIsAddOpen(true);
  };

  const handleDeleteClick = (productId) => {
    if (confirm('Are you sure you want to delete this product from the inventory?')) {
      setInventory(prev => prev.filter(p => p.id !== productId));
    }
  };

  const handleOtcSubmit = (e) => {
    e.preventDefault();
    if (!otcProductId) return;
    const product = inventory.find(p => p.id === otcProductId);
    if (!product) return;

    if (product.stock < otcQty) {
      alert(`Insufficient stock! Only ${product.stock} left in stock.`);
      return;
    }

    onLogSale(product, otcQty);
    setOtcProductId('');
    setOtcQty(1);
  };

  const resetForm = () => {
    setProductForm({
      sku: '',
      name: '',
      category: 'Key/Valve Oil',
      price: 10,
      stock: 10,
      reorderPoint: 3
    });
    setEditingProduct(null);
  };

  const uniqueCategories = ['Key/Valve Oil', 'Reeds', 'Mouthpieces', 'Parts', 'Cases', 'Accessories'];

  return (
    <div>
      {/* Low stock Alert Banner */}
      {lowStockItems.length > 0 && (
        <div className="alert-banner">
          <AlertTriangle size={20} />
          <div className="alert-banner-content">
            <strong>Low Stock Alert:</strong> {lowStockItems.length} products have fallen below their reorder thresholds:
            <span style={{ fontWeight: '500', marginLeft: '6px' }}>
              {lowStockItems.map(i => `${i.name} (${i.stock} left)`).join(', ')}
            </span>
          </div>
        </div>
      )}

      <div className="grid-inventory">
        {/* Main Product Table */}
        <div>
          {/* Controls */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ position: 'relative', flexGrow: 1 }}>
                <input 
                  type="text" 
                  placeholder="Search products by name, SKU..." 
                  className="input-control"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={16} className="text-muted" style={{ position: 'absolute', left: '14px', top: '15px' }} />
              </div>
              <select 
                className="input-control"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button 
                className="btn btn-primary"
                onClick={() => { resetForm(); setIsAddOpen(true); }}
              >
                <Plus size={16} /> Add Product
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>In Stock</th>
                  <th>Min Limit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(item => {
                  const isLow = item.stock <= item.reorderPoint;
                  return (
                    <tr key={item.id}>
                      <td><code>{item.sku}</code></td>
                      <td style={{ fontWeight: '600' }}>{item.name}</td>
                      <td>{item.category}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>{item.stock} units</td>
                      <td>{item.reorderPoint}</td>
                      <td>
                        <span className={`badge ${isLow ? 'badge-low-stock' : 'badge-in-stock'}`}>
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px' }}
                            onClick={() => handleEditClick(item)}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '6px' }}
                            onClick={() => handleDeleteClick(item.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* OTC Direct Sales Panel */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} className="text-gold" /> Quick Retail Checkout
          </h3>
          <p className="text-muted" style={{ fontSize: '13px', marginBottom: '20px' }}>
            Log counter sales for walk-in customers instantly. Stock will deduct and a draft invoice will register in the invoicing queue.
          </p>

          <form onSubmit={handleOtcSubmit}>
            <div className="form-group">
              <label>Select Item</label>
              <select 
                className="input-control" 
                required
                value={otcProductId}
                onChange={(e) => setOtcProductId(e.target.value)}
              >
                <option value="">-- Choose Stock Product --</option>
                {inventory.map(p => (
                  <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                    {p.name} (${p.price.toFixed(2)} - Stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Quantity</label>
              <input 
                type="number" 
                min="1" 
                required 
                className="input-control"
                value={otcQty}
                onChange={(e) => setOtcQty(parseInt(e.target.value) || 1)}
              />
            </div>

            {otcProductId && (
              <div className="card" style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', marginBottom: '16px', fontSize: '14px' }}>
                <div className="flex-space">
                  <span>Price:</span>
                  <span>${(inventory.find(i => i.id === otcProductId)?.price || 0).toFixed(2)}</span>
                </div>
                <div className="flex-space" style={{ marginTop: '4px' }}>
                  <span>Qty:</span>
                  <span>{otcQty}</span>
                </div>
                <hr style={{ border: 0, borderBottom: '1px solid var(--border-subtle)', margin: '8px 0' }} />
                <div className="flex-space" style={{ fontWeight: 'bold' }}>
                  <span className="text-gold">Total Due:</span>
                  <span className="text-gold">
                    ${((inventory.find(i => i.id === otcProductId)?.price || 0) * otcQty).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={!otcProductId}>
              Record & Generate Invoice
            </button>
          </form>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product Details' : 'Register New Inventory Product'}</h3>
              <button className="close-btn" onClick={() => { setIsAddOpen(false); resetForm(); }}>&times;</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>SKU (Stock Keeping Unit)</label>
                    <input 
                      type="text" 
                      required 
                      className="input-control" 
                      placeholder="e.g. OIL-VALVE-Y"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Product Category</label>
                    <select 
                      className="input-control"
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    >
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Product Name</label>
                  <input 
                    type="text" 
                    required 
                    className="input-control" 
                    placeholder="e.g. Vandoren Tenor Saxophone Reeds Box"
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Retail Price ($)</label>
                    <input 
                      type="number" 
                      step="0.05" 
                      required 
                      className="input-control"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Initial Stock Level</label>
                    <input 
                      type="number" 
                      required 
                      className="input-control"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Reorder Limit</label>
                    <input 
                      type="number" 
                      required 
                      className="input-control"
                      value={productForm.reorderPoint}
                      onChange={(e) => setProductForm({...productForm, reorderPoint: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => { setIsAddOpen(false); resetForm(); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
