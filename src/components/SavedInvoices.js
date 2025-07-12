// src/components/SavedInvoices.js
import React from 'react';
import { Table, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function SavedInvoices({ setInvoiceData }) {
  const navigate = useNavigate();
  const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');

  const handleDelete = (id) => {
    const confirmDelete = window.confirm('🗑️ Are you sure you want to delete this invoice?');
    if (!confirmDelete) return;

    const updated = invoices.filter(inv => inv.id !== id);
    localStorage.setItem('invoices', JSON.stringify(updated));
    window.location.reload(); // Trigger refresh
  };

  const handleRestore = (invoice) => {
    if (setInvoiceData) {
      setInvoiceData(invoice);
      navigate('/invoice-builder');
    } else {
      alert('🔁 Cannot restore from this context.');
    }
  };

  const calculateTotal = (items = []) =>
    items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0).toFixed(2);

  return (
    <div className="container py-4">
      

      {invoices.length === 0 ? (
        <Alert variant="info">No saved invoices found.</Alert>
      ) : (
        <Table striped bordered hover responsive className="bg-white shadow-sm">
          <thead className="table-light">
            <tr>
              <th>Client</th>
              <th>Email</th>
              <th>Date</th>
              <th>Total Items</th>
              <th>Total (R)</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td>{inv.clientName || '—'}</td>
                <td>{inv.clientEmail || '—'}</td>
                <td>{new Date(inv.date).toLocaleDateString()}</td>
                <td>{inv.items?.length || 0}</td>
                <td>R{calculateTotal(inv.items)}</td>
                <td>
                  <span className={`badge bg-${inv.status === 'PAID' ? 'success' : inv.status === 'OVERDUE' ? 'danger' : 'warning'}`}>
                    {inv.status || 'DUE'}
                  </span>
                </td>
                <td className="d-flex gap-2 justify-content-center">
                  <Button variant="outline-primary" size="sm" onClick={() => handleRestore(inv)}>
                    🔄 Restore
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => handleDelete(inv.id)}>
                    🗑️ Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default SavedInvoices;
