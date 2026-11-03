import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Check, 
  Receipt, 
  ShoppingBag,
  PlusCircle,
  Save,
  RotateCcw
} from 'lucide-react';
import { hotelService } from '../../services/hotelService';
import { toast } from 'sonner';

const DEFAULT_CATALOG = [
  { name: 'Water Bottle (1L)', price: 20 },
  { name: 'Chai / Tea', price: 20 },
  { name: 'Hot Coffee', price: 30 },
  { name: 'Cold Drink (750ml)', price: 40 },
  { name: 'Breakfast / Snacks', price: 70 },
  { name: 'Meal / Veg Thali', price: 150 },
  { name: 'Extra Bed / Mattress', price: 300 },
  { name: 'Laundry Service', price: 100 },
];

export default function AddRoomChargeModal({
  isOpen,
  onClose,
  stay,
  onChargeUpdated
}) {
  if (!isOpen || !stay) return null;

  const storageKey = `hotel_custom_items_catalog_${stay.hotelId || 'HTL-101'}`;

  // Catalog state with default items + stored custom items
  const [catalog, setCatalog] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_CATALOG;
  });

  const [selectedItemName, setSelectedItemName] = useState(DEFAULT_CATALOG[0].name);
  const [itemPrice, setItemPrice] = useState(DEFAULT_CATALOG[0].price);
  const [itemQty, setItemQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Mode for adding new custom item into the dropdown catalog
  const [isAddingNewToCatalog, setIsAddingNewToCatalog] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const currentItems = Array.isArray(stay.extraItems) ? stay.extraItems : [];
  const currentExtras = currentItems.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const roomRate = Number(stay.roomRate || 0);
  const advancePaid = Number(stay.advancePaid || 0);
  const totalBill = roomRate + currentExtras;
  const balanceDue = totalBill - advancePaid;

  // Handle dropdown selection
  const handleDropdownChange = (val) => {
    if (val === '__ADD_NEW__') {
      setIsAddingNewToCatalog(true);
      setNewItemName('');
      setNewItemPrice('');
    } else {
      setIsAddingNewToCatalog(false);
      setSelectedItemName(val);
      const found = catalog.find(c => c.name === val);
      if (found) {
        setItemPrice(found.price);
      }
    }
  };

  // Save new custom item to catalog & select it
  const handleSaveNewToCatalog = (e) => {
    if (e) e.preventDefault();
    const cleanName = newItemName.trim();
    const cleanPrice = Math.max(0, parseFloat(newItemPrice) || 0);

    if (!cleanName) {
      alert('Please enter item or service name.');
      return;
    }

    const updatedCatalog = [...catalog];
    const existingIndex = updatedCatalog.findIndex(c => c.name.toLowerCase() === cleanName.toLowerCase());
    if (existingIndex >= 0) {
      updatedCatalog[existingIndex].price = cleanPrice;
    } else {
      updatedCatalog.push({ name: cleanName, price: cleanPrice });
    }

    setCatalog(updatedCatalog);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedCatalog));
    } catch (_) {}

    setSelectedItemName(cleanName);
    setItemPrice(cleanPrice);
    setIsAddingNewToCatalog(false);
  };

  const handleAddItem = async (e) => {
    if (e) e.preventDefault();
    const finalName = selectedItemName.trim();
    if (!finalName || Number(itemPrice) < 0 || Number(itemQty) <= 0) {
      alert('Please select valid item and price.');
      return;
    }

    setIsSubmitting(true);
    const itemData = {
      name: finalName,
      price: Number(itemPrice),
      qty: Number(itemQty),
      total: Number(itemPrice) * Number(itemQty)
    };

    try {
      await hotelService.addExtraCharge(stay.roomNumber, itemData, stay.hotelId);
      setSuccessToast(`✓ Added ₹${itemData.total} (${itemData.name}) to room bill!`);
      toast.success(`✓ Added ₹${itemData.total} (${itemData.name}) to Room ${stay.roomNumber} bill!`);
      setTimeout(() => setSuccessToast(''), 2500);
      
      // Update local stay object immediately
      if (!stay.extraItems) stay.extraItems = [];
      stay.extraItems.push({
        id: `ITEM-${Date.now()}`,
        ...itemData,
        addedAt: new Date().toISOString()
      });
      stay.extraCharges = (stay.extraCharges || 0) + itemData.total;

      // Reset qty back to 1
      setItemQty(1);

      if (onChargeUpdated) {
        onChargeUpdated();
      }
      toast.info(`Removed charge item from Room ${stay.roomNumber} bill`);
    } catch (err) {
      console.error('Error adding charge:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await hotelService.removeExtraCharge(stay.roomNumber, itemId, stay.hotelId);
      if (stay.extraItems) {
        stay.extraItems = stay.extraItems.filter(x => x.id !== itemId);
        stay.extraCharges = stay.extraItems.reduce((s, x) => s + Number(x.total || 0), 0);
      }
      if (onChargeUpdated) {
        onChargeUpdated();
      }
    } catch (err) {
      console.error('Error removing item charge:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-[#0b3c33] rounded-xl shadow-xs">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-slate-900 text-lg leading-tight">
                  Add Item / Service to Bill
                </h3>
                <span className="font-mono text-xs font-black text-[#0b3c33] bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-md">
                  RM-{stay.roomNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Guest: <strong className="text-slate-800">{stay.primaryGuest?.name || 'Occupied Guest'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Success Banner */}
          {successToast && (
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-between animate-in zoom-in-95 duration-150 shadow-sm">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" /> {successToast}
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAddItem} className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3.5">
            
            {/* Item Dropdown with Add Option */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Item / Service Name *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewToCatalog(!isAddingNewToCatalog)}
                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  <PlusCircle className="h-3 w-3" />
                  {isAddingNewToCatalog ? 'Cancel New Item' : '+ Add New Item to Menu'}
                </button>
              </div>

              {!isAddingNewToCatalog ? (
                <select
                  value={selectedItemName}
                  onChange={(e) => handleDropdownChange(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0b3c33] focus:ring-2 focus:ring-emerald-100 shadow-2xs cursor-pointer"
                >
                  <optgroup label="Popular Quick Items">
                    {catalog.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name} (₹{item.price})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Manage Menu">
                    <option value="__ADD_NEW__">
                      ➕ + Add New Item / Custom Service...
                    </option>
                  </optgroup>
                </select>
              ) : (
                /* Inline Box to Create a New Item in Menu */
                <div className="p-3 bg-white border border-emerald-300 rounded-xl space-y-2.5 shadow-xs animate-in fade-in duration-150">
                  <span className="text-[11px] font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1">
                    <PlusCircle className="h-3.5 w-3.5 text-emerald-700" />
                    Create New Menu Item
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Item name (e.g. Milk, Sandwich)"
                      className="sm:col-span-2 h-9 px-3 text-xs rounded-lg border border-slate-200 font-bold text-slate-900 outline-none focus:border-emerald-600"
                      autoFocus
                    />
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="Price"
                        className="w-full h-9 pl-6 pr-2 text-xs rounded-lg border border-slate-200 font-mono font-bold text-slate-900 outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewToCatalog(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewToCatalog}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                    >
                      <Save className="h-3 w-3" /> Save to Menu
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Rate & Quantity */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Rate (₹ / unit)</label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded border border-emerald-200">Editable</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full h-10 pl-7 pr-3 text-xs bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none focus:border-[#0b3c33] shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Quantity</label>
                <div className="flex items-center h-10 border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                    className="w-10 h-full text-slate-600 hover:bg-slate-100 font-bold flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-mono font-black text-xs text-slate-900">
                    {itemQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setItemQty(itemQty + 1)}
                    className="w-10 h-full text-slate-600 hover:bg-slate-100 font-bold flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-600">
                Total: <strong className="font-mono text-emerald-800 text-sm font-black">₹{Number(itemPrice) * Number(itemQty)}</strong>
              </span>

              <button
                type="submit"
                disabled={isSubmitting || isAddingNewToCatalog}
                className="px-5 py-2.5 rounded-xl bg-[#0b3c33] hover:bg-[#072620] text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
              >
                <Plus className="h-4 w-4 text-emerald-300" />
                Add to Room Bill (+₹{Number(itemPrice) * Number(itemQty)})
              </button>
            </div>
          </form>

          {/* Currently Added Items for this Stay */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-indigo-600" />
                Added Items for Room {stay.roomNumber} ({currentItems.length})
              </h4>
              <span className="text-xs font-black font-mono text-emerald-800">
                Total Extras: ₹{currentExtras}
              </span>
            </div>

            {currentItems.length === 0 ? (
              <div className="py-5 text-center text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                No extra items added yet. Select from the dropdown above to add to this guest's bill.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white max-h-40 overflow-y-auto">
                {currentItems.map((it) => (
                  <div key={it.id || it.name} className="flex items-center justify-between p-2.5 hover:bg-slate-50 text-xs transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 leading-tight">
                        {it.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {it.qty || 1} × ₹{it.price} • Added {it.addedAt ? new Date(it.addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-slate-900 text-xs">
                        ₹{it.total}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Running Bill Calculation */}
          <div className="p-3.5 rounded-xl bg-slate-100/90 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Room Tariff ({stay.stayType || '24h Stay'}):</span>
              <span className="font-mono font-bold text-slate-900">₹{roomRate}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Additional Services & Extras:</span>
              <span className="font-mono font-bold text-emerald-800">+₹{currentExtras}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Advance Paid at Check-In:</span>
              <span className="font-mono font-bold text-slate-700">-₹{advancePaid}</span>
            </div>
            <div className="flex justify-between font-black pt-1.5 border-t border-slate-200 text-slate-900">
              <span>Current Balance Due at Checkout:</span>
              <span className={`font-mono text-sm ${balanceDue > 0 ? 'text-rose-700' : 'text-emerald-800'}`}>
                ₹{balanceDue > 0 ? balanceDue : 0} {balanceDue <= 0 && '(Cleared)'}
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Items are included automatically in Check-Out & Printable Slip.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
