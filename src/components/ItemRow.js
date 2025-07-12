// src/components/ItemRow.js
import React from 'react';

function ItemRow({ index, item, onItemChange, onRemoveItem }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue =
      name === 'quantity' || name === 'price'
        ? parseFloat(value) || 0
        : value;

    const updatedItem = {
      ...item,
      [name]: parsedValue,
    };
    onItemChange(index, updatedItem);
  };

  const rowTotal = ((item?.quantity || 0) * (item?.price || 0)).toFixed(2);

  return (
    <div className="row align-items-end mb-3 border rounded p-3 shadow-sm bg-white">
      <div className="col-md-4">
        <label className="form-label">Description</label>
        <input
          type="text"
          name="description"
          value={item?.description || ''}
          onChange={handleChange}
          className="form-control"
          placeholder="Item description"
          required
        />
      </div>

      <div className="col-md-2">
        <label className="form-label">Quantity</label>
        <input
          type="number"
          name="quantity"
          value={item?.quantity ?? 1}
          onChange={handleChange}
          className="form-control"
          min="1"
          step="1"
          placeholder="Qty"
          required
        />
      </div>

      <div className="col-md-2">
        <label className="form-label">Unit Price (R)</label>
        <input
          type="number"
          name="price"
          value={item?.price ?? 0}
          onChange={handleChange}
          className="form-control"
          step="0.01"
          placeholder="0.00"
          required
        />
      </div>

      <div className="col-md-2">
        <label className="form-label">Total</label>
        <div
          className="form-control bg-light text-end fw-bold"
          title="Calculated as Quantity × Unit Price"
        >
          R{rowTotal}
        </div>
      </div>

      <div className="col-md-2 d-grid">
        <label className="form-label invisible">Remove</label>
        <button
          type="button"
          className="btn btn-outline-danger btn-sm"
          onClick={() => onRemoveItem(index)}
          title="Remove this item"
        >
          ❌ Remove
        </button>
      </div>
    </div>
  );
}

export default ItemRow;
