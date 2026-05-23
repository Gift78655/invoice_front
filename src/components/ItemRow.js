// src/components/ItemRow.js
import React, { useMemo } from 'react';

const itemCategories = [
  'Inverter',
  'Battery',
  'Solar Panels',
  'Mounting',
  'DC Protection',
  'AC Protection',
  'Cabling',
  'DB Board Work',
  'Labour',
  'COC',
  'SSEG',
  'Monitoring',
  'Transport',
  'Maintenance',
  'Geyser Conversion',
  'General',
];

function ItemRow({ index, item, onItemChange, onRemoveItem }) {
  const itemNumber = index + 1;

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

  const rowTotal = useMemo(() => {
    return (Number(item?.quantity || 0) * Number(item?.price || 0)).toFixed(2);
  }, [item?.quantity, item?.price]);

  const itemTitle = item?.description || item?.category || `Item ${itemNumber}`;

  const completionState = useMemo(() => {
    const hasDescription = Boolean(item?.description);
    const hasPricing = Number(item?.quantity) > 0 && Number(item?.price) >= 0;
    const hasEquipmentInfo = Boolean(item?.brand || item?.model || item?.rating);

    if (hasDescription && hasPricing && hasEquipmentInfo) {
      return {
        label: 'Detailed',
        className: 'complete',
      };
    }

    if (hasDescription && hasPricing) {
      return {
        label: 'Basic',
        className: 'partial',
      };
    }

    return {
      label: 'Needs details',
      className: 'needed',
    };
  }, [item]);

  return (
    <article className="item-row-card">
      <header className="item-row-header">
        <div className="item-row-title-block">
          <span className="item-row-index">#{itemNumber}</span>

          <div>
            <h6>{itemTitle}</h6>
            <p>
              {item?.category || 'General'}
              {item?.brand ? ` · ${item.brand}` : ''}
              {item?.model ? ` · ${item.model}` : ''}
            </p>
          </div>
        </div>

        <div className="item-row-summary">
          <span className={`item-row-status ${completionState.className}`}>
            {completionState.label}
          </span>

          <strong>R{rowTotal}</strong>
        </div>
      </header>

      <div className="item-row-grid">
        <div className="item-field item-field-category">
          <label className="form-label">Category</label>
          <select
            name="category"
            value={item?.category || 'General'}
            onChange={handleChange}
            className="form-select"
          >
            {itemCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="item-field">
          <label className="form-label">Brand</label>
          <input
            type="text"
            name="brand"
            value={item?.brand || ''}
            onChange={handleChange}
            className="form-control"
            placeholder="Deye, Felicity, JA Solar"
          />
        </div>

        <div className="item-field">
          <label className="form-label">Model</label>
          <input
            type="text"
            name="model"
            value={item?.model || ''}
            onChange={handleChange}
            className="form-control"
            placeholder="SUN-8K, LPBA48100"
          />
        </div>

        <div className="item-field">
          <label className="form-label">Rating / Size</label>
          <input
            type="text"
            name="rating"
            value={item?.rating || ''}
            onChange={handleChange}
            className="form-control"
            placeholder="5kW, 5.12kWh, 550W"
          />
        </div>

        <div className="item-field">
          <label className="form-label">Warranty</label>
          <input
            type="text"
            name="warranty"
            value={item?.warranty || ''}
            onChange={handleChange}
            className="form-control"
            placeholder="Manufacturer warranty"
          />
        </div>

        <div className="item-field item-field-description">
          <label className="form-label">Description / Scope</label>
          <input
            type="text"
            name="description"
            value={item?.description || ''}
            onChange={handleChange}
            className="form-control"
            placeholder="e.g. 5kW hybrid inverter, labour, DC protection"
            required
          />
        </div>

        <div className="item-field">
          <label className="form-label">Quantity</label>
          <input
            type="number"
            name="quantity"
            value={item?.quantity ?? 1}
            onChange={handleChange}
            className="form-control"
            min="0"
            step="1"
            placeholder="Qty"
            inputMode="decimal"
            required
          />
        </div>

        <div className="item-field">
          <label className="form-label">Unit Price</label>
          <div className="input-group">
            <span className="input-group-text">R</span>
            <input
              type="number"
              name="price"
              value={item?.price ?? 0}
              onChange={handleChange}
              className="form-control"
              step="0.01"
              min="0"
              placeholder="0.00"
              inputMode="decimal"
              required
            />
          </div>
        </div>

        <div className="item-field item-field-note">
          <label className="form-label">Supplier / Datasheet Note</label>
          <input
            type="text"
            name="notes"
            value={item?.notes || ''}
            onChange={handleChange}
            className="form-control"
            placeholder="Optional note"
          />
        </div>

        <div className="item-row-total-box">
          <span>Line Total</span>
          <strong>R{rowTotal}</strong>
          <small>Qty × Unit Price</small>
        </div>
      </div>

      <footer className="item-row-footer">
        <small>
          Tip: Add brand, model, rating and warranty where possible for a stronger bank-ready proposal.
        </small>

        <button
          type="button"
          className="btn btn-outline-danger btn-sm item-remove-btn"
          onClick={() => onRemoveItem(index)}
          title="Remove this item"
          aria-label={`Remove item ${itemNumber}`}
        >
          Remove Item
        </button>
      </footer>
    </article>
  );
}

export default ItemRow;