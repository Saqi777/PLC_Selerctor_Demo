import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Search, 
  Database, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Lock,
  Cpu,
  Activity,
  Zap,
  Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Product, FilterState } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DIO_OPTIONS = [512, 1024, 2048];
const AIO_OPTIONS = [128, 256];

export default function App() {
  const [filters, setFilters] = useState<FilterState>({
    dio: "",
    aio: "",
    serial_ports: 0,
    pulse_axes: 0,
    ethercat_real_or_virtual_axes: 0,
    ethercat_virtual_axes: 0,
    pulse_interp_linear: false,
    pulse_interp_circular: false,
    pulse_interp_fixed: false,
    ethercat_interp_linear: false,
    ethercat_interp_circular: false,
    ethercat_interp_fixed: false,
    ethercat_interp_spiral: false,
    e_cam_axes: 0,
  });

  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminCommand, setAdminCommand] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    model: "",
    dio: 0,
    aio: 0,
    serial_ports: 0,
    pulse_axes: 0,
    ethercat_real_or_virtual_axes: 0,
    ethercat_virtual_axes: 0,
    pulse_interp_linear: false,
    pulse_interp_circular: false,
    pulse_interp_fixed: false,
    ethercat_interp_linear: false,
    ethercat_interp_circular: false,
    ethercat_interp_fixed: false,
    ethercat_interp_spiral: false,
    e_cam_axes: 0,
  });

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const executeSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = adminCommand.trim();
    
    // Support both full command and direct password entry
    let pwd = "";
    if (cmd.startsWith("进入管理员模式：") || cmd.startsWith("进入管理员模式:")) {
      pwd = cmd.replace("进入管理员模式：", "").replace("进入管理员模式:", "").trim();
    } else if (cmd === "hanadmin123") {
      pwd = "hanadmin123";
    }

    // Exit command
    if (cmd === "hanadmin321" || cmd === "退出管理员模式:hanadmin321" || cmd === "退出管理员模式：hanadmin321") {
      setAdminMode(false);
      setAdminPassword("");
      setAdminCommand("");
      return;
    }

    if (pwd === "hanadmin123") {
      setAdminMode(true);
      setAdminPassword(pwd);
      fetchAllProducts();
    } else if (cmd !== "") {
      // Only alert if they actually typed something that didn't match
      alert("指令或密码错误");
    }
    setAdminCommand("");
  };

  const fetchAllProducts = async () => {
    try {
      const response = await fetch('/api/products/all');
      const data = await response.json();
      setAllProducts(data);
    } catch (error) {
      console.error("Failed to fetch all products:", error);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (response.ok) {
        alert("Database loaded from MPLC_Product_en.json");
        fetchAllProducts();
      } else {
        alert("Load failed. Check if MPLC_Product_en.json exists in root.");
      }
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToJson = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (response.ok) {
        alert("Database saved to MPLC_Product_en.json");
      } else {
        alert("Save failed.");
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/admin/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword, product: newProduct }),
      });
      if (response.ok) {
        alert("Product added successfully");
        setShowAddModal(false);
        fetchAllProducts();
        setNewProduct({
          model: "",
          dio: 0,
          aio: 0,
          serial_ports: 0,
          pulse_axes: 0,
          ethercat_real_or_virtual_axes: 0,
          ethercat_virtual_axes: 0,
          pulse_interp_linear: false,
          pulse_interp_circular: false,
          pulse_interp_fixed: false,
          ethercat_interp_linear: false,
          ethercat_interp_circular: false,
          ethercat_interp_fixed: false,
          ethercat_interp_spiral: false,
          e_cam_axes: 0,
        });
      } else {
        const err = await response.json();
        alert("Failed to add product: " + err.error);
      }
    } catch (error) {
      console.error("Add error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center">
        <div>
          <h1 className="font-serif italic text-3xl tracking-tight">PLC Selector Pro</h1>
          <p className="text-[11px] uppercase tracking-widest opacity-50 mt-1">Industrial Control Selection System v2.4</p>
        </div>
        <div className="flex items-center gap-4">
          <form onSubmit={handleAdminCommand} className="relative">
            <input 
              type="text" 
              value={adminCommand}
              onChange={(e) => setAdminCommand(e.target.value)}
              placeholder="Command line..."
              className="bg-transparent border border-[#141414]/20 rounded-full px-4 py-1 text-xs focus:outline-none focus:border-[#141414] w-48 transition-all"
            />
          </form>
          {adminMode && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#141414] text-[#E4E3E0] rounded-full text-[10px] font-bold uppercase tracking-tighter">
              <Lock size={12} /> Admin Active
            </div>
          )}
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-[400px_1fr] min-h-[calc(100vh-89px)]">
        {/* Sidebar Filters */}
        <aside className="border-r border-[#141414] p-8 overflow-y-auto max-h-[calc(100vh-89px)]">
          <div className="flex items-center gap-2 mb-8">
            <Settings size={18} className="opacity-50" />
            <h2 className="font-serif italic text-xl">Selection Parameters</h2>
          </div>

          <div className="space-y-8">
            {/* Numerical Selects */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold opacity-50 tracking-widest block">DIO Count (Min)</label>
                <select 
                  value={filters.dio} 
                  onChange={(e) => handleFilterChange('dio', e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                >
                  <option value="">Any</option>
                  {DIO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold opacity-50 tracking-widest block">AIO Count (Min)</label>
                <select 
                  value={filters.aio} 
                  onChange={(e) => handleFilterChange('aio', e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                >
                  <option value="">Any</option>
                  {AIO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-6">
              <RangeInput 
                label="Serial Ports" 
                value={filters.serial_ports} 
                max={14} 
                onChange={(v) => handleFilterChange('serial_ports', v)} 
                icon={<Network size={14} />}
              />
              <RangeInput 
                label="Pulse Axes" 
                value={filters.pulse_axes} 
                max={8} 
                onChange={(v) => handleFilterChange('pulse_axes', v)} 
                icon={<Activity size={14} />}
              />
              <RangeInput 
                label="EtherCAT Real/Virtual Axes" 
                value={filters.ethercat_real_or_virtual_axes} 
                max={16} 
                onChange={(v) => handleFilterChange('ethercat_real_or_virtual_axes', v)} 
                icon={<Zap size={14} />}
              />
              <RangeInput 
                label="EtherCAT Virtual Axes" 
                value={filters.ethercat_virtual_axes} 
                max={16} 
                onChange={(v) => handleFilterChange('ethercat_virtual_axes', v)} 
                icon={<Zap size={14} />}
              />
              <RangeInput 
                label="E-Cam Axes (EtherCAT)" 
                value={filters.e_cam_axes} 
                max={16} 
                onChange={(v) => handleFilterChange('e_cam_axes', v)} 
                icon={<Cpu size={14} />}
              />
            </div>

            {/* Interpolation Toggles */}
            <div className="space-y-4">
              <label className="text-[10px] uppercase font-bold opacity-50 tracking-widest block">Pulse Interpolation</label>
              <div className="flex flex-wrap gap-2">
                <ToggleButton 
                  label="Linear" 
                  active={filters.pulse_interp_linear} 
                  onClick={() => handleFilterChange('pulse_interp_linear', !filters.pulse_interp_linear)} 
                />
                <ToggleButton 
                  label="Circular" 
                  active={filters.pulse_interp_circular} 
                  onClick={() => handleFilterChange('pulse_interp_circular', !filters.pulse_interp_circular)} 
                />
                <ToggleButton 
                  label="Fixed L/A" 
                  active={filters.pulse_interp_fixed} 
                  onClick={() => handleFilterChange('pulse_interp_fixed', !filters.pulse_interp_fixed)} 
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase font-bold opacity-50 tracking-widest block">EtherCAT Interpolation</label>
              <div className="flex flex-wrap gap-2">
                <ToggleButton 
                  label="Linear" 
                  active={filters.ethercat_interp_linear} 
                  onClick={() => handleFilterChange('ethercat_interp_linear', !filters.ethercat_interp_linear)} 
                />
                <ToggleButton 
                  label="Circular" 
                  active={filters.ethercat_interp_circular} 
                  onClick={() => handleFilterChange('ethercat_interp_circular', !filters.ethercat_interp_circular)} 
                />
                <ToggleButton 
                  label="Fixed L/A" 
                  active={filters.ethercat_interp_fixed} 
                  onClick={() => handleFilterChange('ethercat_interp_fixed', !filters.ethercat_interp_fixed)} 
                />
                <ToggleButton 
                  label="Spiral" 
                  active={filters.ethercat_interp_spiral} 
                  onClick={() => handleFilterChange('ethercat_interp_spiral', !filters.ethercat_interp_spiral)} 
                />
              </div>
            </div>

            <button 
              onClick={executeSearch}
              disabled={loading}
              className="w-full bg-[#141414] text-[#E4E3E0] py-4 font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#141414]/90 transition-all disabled:opacity-50"
            >
              {loading ? "Processing..." : "Confirm Selection"}
              <ChevronRight size={18} />
            </button>
          </div>
        </aside>

        {/* Results Area */}
        <section className="p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {adminMode ? (
              <motion.div 
                key="admin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="font-serif italic text-3xl">Master Database</h2>
                    <p className="text-xs opacity-50 mt-1">Full access to raw product parameters (Source: MPLC_Product_en.json)</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-all"
                    >
                      <Cpu size={14} /> Add Product
                    </button>
                    <button 
                      onClick={handleSync}
                      disabled={loading}
                      className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-all disabled:opacity-50"
                    >
                      <FileSpreadsheet size={14} /> Load from JSON
                    </button>
                    <button 
                      onClick={handleSaveToJson}
                      disabled={loading}
                      className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-all disabled:opacity-50"
                    >
                      <FileSpreadsheet size={14} /> Save to JSON
                    </button>
                  </div>
                </div>
                <ProductTable products={allProducts} />

                {/* Add Product Modal */}
                <AnimatePresence>
                  {showAddModal && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-[#141414]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    >
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-[#E4E3E0] border border-[#141414] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                      >
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="font-serif italic text-2xl">Add New Product</h2>
                          <button onClick={() => setShowAddModal(false)} className="opacity-50 hover:opacity-100">✕</button>
                        </div>
                        <form onSubmit={handleAddProduct} className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold opacity-50">Model Name</label>
                              <input 
                                required
                                type="text" 
                                value={newProduct.model}
                                onChange={(e) => setNewProduct({...newProduct, model: e.target.value})}
                                className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold opacity-50">DIO Count</label>
                              <input 
                                type="number" 
                                value={newProduct.dio}
                                onChange={(e) => setNewProduct({...newProduct, dio: Number(e.target.value)})}
                                className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold opacity-50">AIO Count</label>
                              <input 
                                type="number" 
                                value={newProduct.aio}
                                onChange={(e) => setNewProduct({...newProduct, aio: Number(e.target.value)})}
                                className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold opacity-50">Serial Ports</label>
                              <input 
                                type="number" 
                                value={newProduct.serial_ports}
                                onChange={(e) => setNewProduct({...newProduct, serial_ports: Number(e.target.value)})}
                                className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold opacity-50">Pulse Axes</label>
                              <input 
                                type="number" 
                                value={newProduct.pulse_axes}
                                onChange={(e) => setNewProduct({...newProduct, pulse_axes: Number(e.target.value)})}
                                className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold opacity-50">ECAT Real/Virtual Axes</label>
                              <input 
                                type="number" 
                                value={newProduct.ethercat_real_or_virtual_axes}
                                onChange={(e) => setNewProduct({...newProduct, ethercat_real_or_virtual_axes: Number(e.target.value)})}
                                className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold opacity-50">ECAT Virtual Axes</label>
                              <input 
                                type="number" 
                                value={newProduct.ethercat_virtual_axes}
                                onChange={(e) => setNewProduct({...newProduct, ethercat_virtual_axes: Number(e.target.value)})}
                                className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold opacity-50">E-CAM Axes</label>
                              <input 
                                type="number" 
                                value={newProduct.e_cam_axes}
                                onChange={(e) => setNewProduct({...newProduct, e_cam_axes: Number(e.target.value)})}
                                className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-[10px] uppercase font-bold opacity-50 block">Features Support</label>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={newProduct.pulse_interp_linear} onChange={(e) => setNewProduct({...newProduct, pulse_interp_linear: e.target.checked})} />
                                <span className="text-xs">Pulse Linear Interp</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={newProduct.pulse_interp_circular} onChange={(e) => setNewProduct({...newProduct, pulse_interp_circular: e.target.checked})} />
                                <span className="text-xs">Pulse Circular Interp</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={newProduct.pulse_interp_fixed} onChange={(e) => setNewProduct({...newProduct, pulse_interp_fixed: e.target.checked})} />
                                <span className="text-xs">Pulse Fixed L/A</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={newProduct.ethercat_interp_linear} onChange={(e) => setNewProduct({...newProduct, ethercat_interp_linear: e.target.checked})} />
                                <span className="text-xs">ECAT Linear Interp</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={newProduct.ethercat_interp_circular} onChange={(e) => setNewProduct({...newProduct, ethercat_interp_circular: e.target.checked})} />
                                <span className="text-xs">ECAT Circular Interp</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={newProduct.ethercat_interp_fixed} onChange={(e) => setNewProduct({...newProduct, ethercat_interp_fixed: e.target.checked})} />
                                <span className="text-xs">ECAT Fixed L/A</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={newProduct.ethercat_interp_spiral} onChange={(e) => setNewProduct({...newProduct, ethercat_interp_spiral: e.target.checked})} />
                                <span className="text-xs">EtherCAT SPIRAL</span>
                              </div>
                            </div>
                          </div>

                          <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#141414] text-[#E4E3E0] py-4 font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-all disabled:opacity-50"
                          >
                            {loading ? "Adding..." : "Add Product to Database"}
                          </button>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : results.length > 0 ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#141414] text-[#E4E3E0] p-3 rounded-full">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h2 className="font-serif italic text-3xl">Match Results</h2>
                    <p className="text-xs opacity-50">Found {results.length} models matching your specifications</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map(product => (
                    <div key={product.id} className="border border-[#141414] p-6 bg-white/50 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-serif italic text-2xl">{product.model}</h3>
                        <span className="text-[10px] font-mono border border-current px-2 py-0.5 rounded">PLC-UNIT</span>
                      </div>
                      <div className="space-y-1 text-xs font-mono opacity-70 group-hover:opacity-100">
                        <div className="flex justify-between"><span>DIO:</span> <span>{product.dio}</span></div>
                        <div className="flex justify-between"><span>AIO:</span> <span>{product.aio}</span></div>
                        <div className="flex justify-between"><span>ECAT Real/Virtual:</span> <span>{product.ethercat_real_or_virtual_axes} Axes</span></div>
                        <div className="flex justify-between"><span>ECAT Virtual:</span> <span>{product.ethercat_virtual_axes} Axes</span></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-8">
                  <h3 className="text-[10px] uppercase font-bold opacity-50 tracking-widest mb-4">Detailed Parameter Comparison</h3>
                  <ProductTable products={results} />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center opacity-20 text-center"
              >
                <Search size={80} strokeWidth={1} />
                <p className="font-serif italic text-2xl mt-4">Awaiting parameters...</p>
                <p className="text-xs uppercase tracking-widest mt-2">Adjust filters to begin selection</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

function RangeInput({ label, value, max, onChange, icon }: { label: string, value: number, max: number, onChange: (v: number) => void, icon?: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-[10px] uppercase font-bold opacity-50 tracking-widest flex items-center gap-2">
          {icon} {label}
        </label>
        <span className="font-mono text-xs font-bold">{value} / {max}</span>
      </div>
      <input 
        type="range" 
        min={0} 
        max={max} 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#141414] h-1 bg-[#141414]/10 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}

function ToggleButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-3 py-1 text-[10px] font-bold uppercase tracking-tighter border transition-all",
        active 
          ? "bg-[#141414] text-[#E4E3E0] border-[#141414]" 
          : "bg-transparent text-[#141414] border-[#141414]/20 hover:border-[#141414]"
      )}
    >
      {label}
    </button>
  );
}

function ProductTable({ products }: { products: Product[] }) {
  return (
    <div className="border border-[#141414] overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-[#141414] text-[#E4E3E0]">
            <th className="p-4 font-serif italic text-xs font-normal border-r border-[#E4E3E0]/20">Product Model</th>
            <th className="p-4 font-serif italic text-xs font-normal border-r border-[#E4E3E0]/20">DIO</th>
            <th className="p-4 font-serif italic text-xs font-normal border-r border-[#E4E3E0]/20">AIO</th>
            <th className="p-4 font-serif italic text-xs font-normal border-r border-[#E4E3E0]/20">Serial</th>
            <th className="p-4 font-serif italic text-xs font-normal border-r border-[#E4E3E0]/20">Pulse</th>
            <th className="p-4 font-serif italic text-xs font-normal border-r border-[#E4E3E0]/20">ECAT Real/Virtual</th>
            <th className="p-4 font-serif italic text-xs font-normal border-r border-[#E4E3E0]/20">ECAT Virtual</th>
            <th className="p-4 font-serif italic text-xs font-normal border-r border-[#E4E3E0]/20">E-CAM</th>
            <th className="p-4 font-serif italic text-xs font-normal">Interpolation Support</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={p.id} className={cn("border-b border-[#141414]", idx % 2 === 0 ? "bg-white/30" : "bg-transparent")}>
              <td className="p-4 font-bold text-sm border-r border-[#141414]/10">{p.model}</td>
              <td className="p-4 font-mono text-xs border-r border-[#141414]/10">{p.dio}</td>
              <td className="p-4 font-mono text-xs border-r border-[#141414]/10">{p.aio}</td>
              <td className="p-4 font-mono text-xs border-r border-[#141414]/10">{p.serial_ports}</td>
              <td className="p-4 font-mono text-xs border-r border-[#141414]/10">{p.pulse_axes}</td>
              <td className="p-4 font-mono text-xs border-r border-[#141414]/10">{p.ethercat_real_or_virtual_axes}</td>
              <td className="p-4 font-mono text-xs border-r border-[#141414]/10">{p.ethercat_virtual_axes}</td>
              <td className="p-4 font-mono text-xs border-r border-[#141414]/10">{p.e_cam_axes}</td>
              <td className="p-4">
                <div className="flex flex-wrap gap-1">
                  {p.pulse_interp_linear && <StatusTag label="P-Linear" />}
                  {p.pulse_interp_circular && <StatusTag label="P-Circular" />}
                  {p.ethercat_interp_linear && <StatusTag label="E-Linear" variant="dark" />}
                  {p.ethercat_interp_circular && <StatusTag label="E-Circular" variant="dark" />}
                  {p.ethercat_interp_spiral && <StatusTag label="E-Spiral" variant="dark" />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusTag({ label, variant = 'light' }: { label: string, variant?: 'light' | 'dark' }) {
  return (
    <span className={cn(
      "text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter",
      variant === 'light' ? "bg-[#141414]/10 text-[#141414]" : "bg-[#141414] text-[#E4E3E0]"
    )}>
      {label}
    </span>
  );
}
