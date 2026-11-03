import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Check, 
  Receipt, 
  Coffee, 
  Droplet, 
  Utensils, 
  Bed, 
  Shirt, 
  Sparkles,
  IndianRupee,
  ShoppingBag
} from 'lucide-react';
import { hotelService } from '../../services/hotelService';

const QUICK_ITEMS = [
  { name: 'Water Bottle (1L)', price: 20, icon: Droplet, category: 'Beverage' },
  { name: 'Chai / Tea', price: 20, icon: Coffee, category: 'Beverage' },
  { name: 'Hot Coffee', price: 30, icon: Coffee, category: 'Beverage' },
  { name: 'Cold Drink (750ml)', price: 40, icon: Coffee, category: 'Beverage' },
  { name: 'Extra Bed / Mattress', price: 300, icon: Bed, category: 'Bedding' },
  { name: 'Meal / Veg Thali', price: 150, icon: Utensils, category: 'Food' },
  { name: 'Breakfast / Snacks', price: 70, icon: Utensils, category: 'Food' },
  { name: 'Laundry Service', price: 100, icon: Shirt, category: 'Service' },
  { name: 'Toiletries / Kit', price: 50, icon: Sparkles, category: 'Amenity' },
];

export default function AddRoomChargeModal({
  isOpen,
  onClose,
  stay,
  onChargeUpdated
}) {
  if (!isOpen || !stay) return null;

  const [itemName, setItemName] = useState('Water Bottle (1L)');
  const [itemPrice, setItemPrice] = useState(20);
  const [itemQty, setItemQty] = useState(1);
  const [selectedQuickIndex, setSelectedQuickIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const currentItems = Array.isArray(stay.extraItems) ? stay.extraItems : [];
  const currentExtras = currentItems.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const roomRate = Number(stay.roomRate || 0);
  const advancePaid = Number(stay.advancePaid || 0);
  const totalBill = roomRate + currentExtras;
  const balanceDue = totalBill - advancePaid;

  const handleSelectQuick = (item, index) => {
    setItemName(item.name);
    setItemPrice(item.price);
    setItemQty(1);
    setSelectedQuickIndex(index);
  };

  const handleAddItem = async (e) => {
    if (e) e.preventDefault();
    if (!itemName.trim() || Number(itemPrice) < 0 || Number(itemQty) <= 0) {
      alert('Please enter valid item name and price.');
      return;
    }

    setIsSubmitting(true);
    const itemData = {
      name: itemName.trim(),
      price: Number(itemPrice),
      qty: Number(itemQty),
      total: Number(itemPrice) * Number(itemQty)
    };

    try {
      await hotelService.addExtraCharge(stay.roomNumber, itemData, stay.hotelId);
      setSuccessToast(`✓ Added ₹${itemData.total} (${itemData.name}) to bill!`);
      setTimeout(() => setSuccessToast(''), 2500);
      
      // Update local stay object immediately
      if (!stay.extraItems) stay.extraItems = [];
      stay.extraItems.push({
        id: `ITEM-${Date.now()}`,
        ...itemData,
        addedAt: new Date().toISOString()
      });
      stay.extraCharges = (stay.extraCharges || 0) + itemData.total;

      if (onChargeUpdated) {
        onChargeUpdated();
      }
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
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

          {/* Quick 1-Click Popular Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Quick 1-Click Popular Items
              </label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Tap to Select
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUICK_ITEMS.map((item, idx) => {
                const IconComponent = item.icon;
                const isSelected = selectedQuickIndex === idx;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleSelectQuick(item, idx)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate leading-tight">
                        {item.name}
                      </div>
                      <div className="text-[11px] font-black text-emerald-700 font-mono">
                        ₹{item.price}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Item Details Form */}
          <form onSubmit={handleAddItem} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Item / Service Name</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => {
                    setItemName(e.target.value);
                    setSelectedQuickIndex(-1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-[#0b3c33] focus:ring-2 focus:ring-emerald-100 shadow-2xs"
                  placeholder="e.g. Water Bottle, Tea, Laundry..."
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Rate (₹ / unit)</label>
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
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Qty:</span>
                <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                    className="w-8 h-9 text-slate-600 hover:bg-slate-100 font-bold flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-9 text-center font-mono font-black text-xs text-slate-900">
                    {itemQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setItemQty(itemQty + 1)}
                    className="w-8 h-9 text-slate-600 hover:bg-slate-100 font-bold flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs font-bold text-slate-600 ml-1">
                  = <strong className="font-mono text-emerald-800 text-sm">₹{Number(itemPrice) * Number(itemQty)}</strong>
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
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
              <div className="py-6 text-center text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                No additional items added yet. Click any quick item above to add to this guest's bill.
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
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Items are automatically included in Check-Out & Printable Slip.
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
