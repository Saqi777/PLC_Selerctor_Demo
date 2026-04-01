import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Search, 
  Database, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
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
import { Product, FilterState, ProductType, MPLCFilterState, HMIFilterState, ServoFilterState, MPLCProduct, HMIProduct, ServoProduct } from './types';
import { translations, Language } from './translations';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DIO_OPTIONS = [512, 1024, 2048];
const AIO_OPTIONS = [128, 256];

const HMI_SIZE_OPTIONS = ["4.3", "7", "10.1", "12", "15"];
const SERVO_POWER_OPTIONS = ["100W", "200W", "400W", "750W", "1KW", "1.5KW", "2KW", "2.9KW", "4KW", "5.5KW", "7.5KW", "15KW"];
const SERVO_CONTROL_OPTIONS = ["Pulse", "EtherCAT"];
const SERVO_VOLTAGE_OPTIONS = ["220V", "380V"];
const SERVO_ENCODER_BITS = ["17bit", "23bit"];
const SERVO_ENCODER_TYPES = ["Magnetic", "Optical"];
const SERVO_ENCODER_MODES = ["Absolute", "Incremental"];

const INITIAL_MPLC_FILTERS: MPLCFilterState = {
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
};

const INITIAL_HMI_FILTERS: HMIFilterState = {
  size: "",
  rs485: "",
  ethernet: "",
  hardware_config: "",
  certification: [],
};

const INITIAL_SERVO_FILTERS: ServoFilterState = {
  power: [],
  control_method: [],
  input_voltage: [],
  encoder_bits: [],
  encoder_type: [],
  encoder_mode: [],
  brake: [],
};

export default function App() {
  const [productType, setProductType] = useState<ProductType>('MPLC');
  const [filters, setFilters] = useState<FilterState>(INITIAL_MPLC_FILTERS);

  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [language, setLanguage] = useState<Language | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(true);
  const [showCards, setShowCards] = useState(true);

  // Reset filters when product type changes
  useEffect(() => {
    if (productType === 'MPLC') setFilters(INITIAL_MPLC_FILTERS);
    else if (productType === 'HMI') setFilters(INITIAL_HMI_FILTERS);
    else if (productType === 'Servo') setFilters(INITIAL_SERVO_FILTERS);
    setResults([]);
  }, [productType]);

  // Load products from JSON on mount or language/productType change
  useEffect(() => {
    if (!language) return;
    
    const loadData = async () => {
      try {
        let fileName = '';
        if (productType === 'MPLC') {
          fileName = language === 'en' ? '/MPLC_Product_en.json' : '/MPLC_Product_cn.json';
        } else if (productType === 'HMI') {
          fileName = language === 'en' ? '/HMI_Product_en.json' : '/HMI_Product_cn.json';
        } else if (productType === 'Servo') {
          fileName = language === 'en' ? '/Servo_Product_en.json' : '/Servo_Product_cn.json';
        }

        const response = await fetch(fileName);
        if (!response.ok) throw new Error("File not found");
        const data = await response.json();
        
        // Add IDs and normalize data
        const normalizedData = data.map((p: any, index: number) => {
          const base = { ...p, id: p.id || index + 1 };
          if (productType === 'MPLC') {
            return {
              ...base,
              pulse_interp_linear: !!p.pulse_interp_linear,
              pulse_interp_circular: !!p.pulse_interp_circular,
              pulse_interp_fixed: !!p.pulse_interp_fixed,
              ethercat_interp_linear: !!p.ethercat_interp_linear,
              ethercat_interp_circular: !!p.ethercat_interp_circular,
              ethercat_interp_fixed: !!p.ethercat_interp_fixed,
              ethercat_interp_spiral: !!p.ethercat_interp_spiral,
              hsc_points: p.hsc_points || 0,
            };
          }
          return base;
        });
        
        setAllProducts(normalizedData);
        setResults([]);
      } catch (error) {
        console.error("Failed to load product data:", error);
        setAllProducts([]);
      }
    };
    loadData();
  }, [language, productType]);

  const t = translations[language || 'en'];

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const executeSearch = () => {
    setLoading(true);
    setTimeout(() => {
      const filtered = allProducts.filter(p => {
        if (productType === 'MPLC') {
          const f = filters as MPLCFilterState;
          const prod = p as MPLCProduct;
          if (f.dio && prod.dio < Number(f.dio)) return false;
          if (f.aio && prod.aio < Number(f.aio)) return false;
          if (f.serial_ports !== undefined && prod.serial_ports < f.serial_ports) return false;
          if (f.pulse_axes !== undefined && prod.pulse_axes < f.pulse_axes) return false;
          if (f.ethercat_real_or_virtual_axes !== undefined && prod.ethercat_real_or_virtual_axes < f.ethercat_real_or_virtual_axes) return false;
          
          if (f.ethercat_virtual_axes !== undefined) {
            const prodTotal = (prod.ethercat_real_or_virtual_axes || 0) + (prod.ethercat_virtual_axes || 0);
            const reqTotal = (f.ethercat_real_or_virtual_axes || 0) + (f.ethercat_virtual_axes || 0);
            if (prodTotal < reqTotal) return false;
          }

          if (f.e_cam_axes !== undefined && prod.e_cam_axes < f.e_cam_axes) return false;

          if (f.pulse_interp_linear && !prod.pulse_interp_linear) return false;
          if (f.pulse_interp_circular && !prod.pulse_interp_circular) return false;
          if (f.pulse_interp_fixed && !prod.pulse_interp_fixed) return false;
          if (f.ethercat_interp_linear && !prod.ethercat_interp_linear) return false;
          if (f.ethercat_interp_circular && !prod.ethercat_interp_circular) return false;
          if (f.ethercat_interp_fixed && !prod.ethercat_interp_fixed) return false;
          if (f.ethercat_interp_spiral && !prod.ethercat_interp_spiral) return false;
        } else if (productType === 'HMI') {
          const f = filters as HMIFilterState;
          const prod = p as HMIProduct;
          if (f.size && prod.size !== f.size) return false;
          if (f.rs485 && prod.rs485 < Number(f.rs485)) return false;
          if (f.ethernet && prod.ethernet < Number(f.ethernet)) return false;
          if (f.hardware_config && prod.hardware_config !== f.hardware_config) return false;
          if (f.certification.length > 0) {
            if (!f.certification.every(c => prod.certification.includes(c))) return false;
          }
        } else if (productType === 'Servo') {
          const f = filters as ServoFilterState;
          const prod = p as ServoProduct;
          if (f.power.length > 0 && !f.power.includes(prod.power)) return false;
          if (f.control_method.length > 0 && !f.control_method.some(m => prod.control_method.includes(m))) return false;
          if (f.input_voltage.length > 0 && !f.input_voltage.some(v => prod.input_voltage.includes(v))) return false;
          if (f.encoder_bits.length > 0 && !f.encoder_bits.some(b => prod.encoder_bits.includes(b))) return false;
          if (f.encoder_type.length > 0 && !f.encoder_type.some(t => prod.encoder_type.includes(t))) return false;
          if (f.encoder_mode.length > 0 && !f.encoder_mode.some(m => prod.encoder_mode.includes(m))) return false;
          if (f.brake.length > 0) {
            const hasBrake = f.brake.includes('Yes');
            const noBrake = f.brake.includes('No');
            if (hasBrake && !noBrake && !prod.brake) return false;
            if (!hasBrake && noBrake && prod.brake) return false;
          }
        }

        return true;
      });
      setResults(filtered);
      setLoading(false);
    }, 300);
  };

  const handleSync = () => {
    alert("In Vercel deployment, data is loaded statically from MPLC_Product_en.json. To update, please modify the JSON file in the repository.");
  };

  const handleSaveToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allProducts, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${productType}_Product_${language}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    alert("JSON file generated. You can use this to update your repository.");
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Add product feature is temporarily disabled during product type expansion.");
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-4 md:p-6 flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-6">
        <div className="flex items-center gap-4 md:gap-6 w-full lg:w-auto justify-between lg:justify-start">
          <a href="https://www.fatek.com/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <img 
              src="https://www.fatek.com/images/logo.png" 
              alt="FATEK Logo" 
              className="h-6 md:h-8 invert"
              onError={(e) => {
                // Fallback to text if logo fails to load
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="font-bold text-xl md:text-2xl tracking-tighter">FATEK</span>';
              }}
            />
          </a>
          <div className="h-8 md:h-10 w-[1px] bg-[#141414]/20" />
          <div>
            <h1 className="font-serif font-bold text-xl md:text-3xl tracking-tight">
              {t.title}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 md:mt-1">
              <p className="text-[9px] md:text-[11px] uppercase tracking-widest opacity-50">{t.subtitle}</p>
              <span className="text-[8px] md:text-[9px] font-mono opacity-30 tracking-tighter">260220</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 md:gap-6 w-full lg:w-auto">
          <div className="flex bg-[#141414]/5 p-1 border border-[#141414]/10">
            {(['MPLC', 'HMI', 'Servo'] as ProductType[]).map((type) => {
              return (
                <button
                  key={type}
                  onClick={() => {
                    setProductType(type);
                    setResults([]); // Clear results immediately to prevent crash
                  }}
                  className={cn(
                    "px-2 sm:px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all",
                    productType === type 
                      ? "bg-[#141414] text-[#E4E3E0]" 
                      : "text-[#141414]/50 hover:text-[#141414]"
                  )}
                >
                  {type}
                </button>
              );
            })}
          </div>
          <button 
            onClick={() => setLanguage(language === 'en' ? 'cn' : 'en')}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-[#141414] px-3 sm:px-4 py-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
          >
            {language === 'en' ? t.chinese : t.english}
          </button>
          <a 
            href="https://docs.google.com/spreadsheets/d/1JdLJxIjBiGuPtVtBH8CNRmlxwd6hz_AF0JzfUAWb0Go/edit?usp=sharing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-[#141414] px-3 sm:px-4 py-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
          >
            <FileSpreadsheet size={14} /> <span className="hidden sm:inline">{t.specTable}</span>
          </a>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-[400px_1fr] min-h-[calc(100vh-89px)]">
        {/* Sidebar Filters */}
        <aside className="border-r border-[#141414] p-4 md:p-8 overflow-y-auto lg:max-h-[calc(100vh-89px)]">
          <div className="flex items-center gap-2 mb-8">
            <Settings size={18} className="opacity-50" />
            <h2 className="font-serif font-bold text-xl">{t.selectionParameters}</h2>
          </div>

          <div className="space-y-8">
            {productType === 'MPLC' && 'dio' in filters && (
              <>
                {/* Numerical Selects */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold opacity-50 tracking-widest block">{t.dioCount}</label>
                    <select 
                      value={(filters as MPLCFilterState).dio} 
                      onChange={(e) => handleFilterChange('dio', e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                    >
                      <option value="">{t.any}</option>
                      {DIO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold opacity-50 tracking-widest block">{t.aioCount}</label>
                    <select 
                      value={(filters as MPLCFilterState).aio} 
                      onChange={(e) => handleFilterChange('aio', e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                    >
                      <option value="">{t.any}</option>
                      {AIO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                {/* Sliders */}
                <div className="space-y-6">
                  <RangeInput 
                    label={t.serialPorts} 
                    value={(filters as MPLCFilterState).serial_ports} 
                    max={14} 
                    onChange={(v) => handleFilterChange('serial_ports', v)} 
                    icon={<Network size={14} />}
                  />
                  <RangeInput 
                    label={t.pulseAxes} 
                    value={(filters as MPLCFilterState).pulse_axes} 
                    max={8} 
                    onChange={(v) => handleFilterChange('pulse_axes', v)} 
                    icon={<Activity size={14} />}
                  />
                  <RangeInput 
                    label={t.ethercatRealAxes} 
                    value={(filters as MPLCFilterState).ethercat_real_or_virtual_axes} 
                    max={16} 
                    onChange={(v) => handleFilterChange('ethercat_real_or_virtual_axes', v)} 
                    icon={<Zap size={14} />}
                  />
                  <RangeInput 
                    label={t.ethercatVirtualAxes} 
                    value={(filters as MPLCFilterState).ethercat_virtual_axes} 
                    max={16} 
                    onChange={(v) => handleFilterChange('ethercat_virtual_axes', v)} 
                    icon={<Zap size={14} />}
                  />
                  <RangeInput 
                    label={t.ecamAxes} 
                    value={(filters as MPLCFilterState).e_cam_axes} 
                    max={16} 
                    onChange={(v) => handleFilterChange('e_cam_axes', v)} 
                    icon={<Cpu size={14} />}
                  />
                </div>

                {/* Interpolation Toggles */}
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold opacity-50 tracking-widest block">{t.pulseInterpolation}</label>
                  <div className="flex flex-wrap gap-2">
                    <ToggleButton 
                      label={t.linear} 
                      active={(filters as MPLCFilterState).pulse_interp_linear} 
                      onClick={() => handleFilterChange('pulse_interp_linear', !(filters as MPLCFilterState).pulse_interp_linear)} 
                    />
                    <ToggleButton 
                      label={t.circular} 
                      active={(filters as MPLCFilterState).pulse_interp_circular} 
                      onClick={() => handleFilterChange('pulse_interp_circular', !(filters as MPLCFilterState).pulse_interp_circular)} 
                    />
                    <ToggleButton 
                      label={t.fixedLA} 
                      active={(filters as MPLCFilterState).pulse_interp_fixed} 
                      onClick={() => handleFilterChange('pulse_interp_fixed', !(filters as MPLCFilterState).pulse_interp_fixed)} 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold opacity-50 tracking-widest block">{t.ethercatInterpolation}</label>
                  <div className="flex flex-wrap gap-2">
                    <ToggleButton 
                      label={t.linear} 
                      active={(filters as MPLCFilterState).ethercat_interp_linear} 
                      onClick={() => handleFilterChange('ethercat_interp_linear', !(filters as MPLCFilterState).ethercat_interp_linear)} 
                    />
                    <ToggleButton 
                      label={t.circular} 
                      active={(filters as MPLCFilterState).ethercat_interp_circular} 
                      onClick={() => handleFilterChange('ethercat_interp_circular', !(filters as MPLCFilterState).ethercat_interp_circular)} 
                    />
                    <ToggleButton 
                      label={t.fixedLA} 
                      active={(filters as MPLCFilterState).ethercat_interp_fixed} 
                      onClick={() => handleFilterChange('ethercat_interp_fixed', !(filters as MPLCFilterState).ethercat_interp_fixed)} 
                    />
                    <ToggleButton 
                      label={t.spiral} 
                      active={(filters as MPLCFilterState).ethercat_interp_spiral} 
                      onClick={() => handleFilterChange('ethercat_interp_spiral', !(filters as MPLCFilterState).ethercat_interp_spiral)} 
                    />
                  </div>
                </div>
              </>
            )}

            {productType === 'HMI' && 'size' in filters && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold opacity-50 tracking-widest block">{t.hmiSize}</label>
                  <select 
                    value={(filters as HMIFilterState).size} 
                    onChange={(e) => handleFilterChange('size', e.target.value)}
                    className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                  >
                    <option value="">{t.any}</option>
                    {HMI_SIZE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold opacity-50 tracking-widest block">RS485 (Min)</label>
                    <select 
                      value={(filters as HMIFilterState).rs485} 
                      onChange={(e) => handleFilterChange('rs485', e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                    >
                      <option value="">{t.any}</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold opacity-50 tracking-widest block">Ethernet (Min)</label>
                    <select 
                      value={(filters as HMIFilterState).ethernet} 
                      onChange={(e) => handleFilterChange('ethernet', e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-transparent border border-[#141414] p-2 text-sm focus:outline-none"
                    >
                      <option value="">{t.any}</option>
                      <option value="0">0</option>
                      <option value="1">1</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold opacity-50 tracking-widest block">{t.hmiHardware}</label>
                  <div className="flex flex-col gap-2">
                    <ToggleButton 
                      label={t.hmiHigh} 
                      active={(filters as HMIFilterState).hardware_config === 'High'} 
                      onClick={() => handleFilterChange('hardware_config', (filters as HMIFilterState).hardware_config === 'High' ? '' : 'High')} 
                    />
                    <ToggleButton 
                      label={t.hmiLow} 
                      active={(filters as HMIFilterState).hardware_config === 'Low'} 
                      onClick={() => handleFilterChange('hardware_config', (filters as HMIFilterState).hardware_config === 'Low' ? '' : 'Low')} 
                    />
                    <p className="text-[9px] opacity-50 italic">{t.hmiNote}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold opacity-50 tracking-widest block">{t.hmiCert}</label>
                  <div className="flex gap-2">
                    {['CE', 'UL'].map(cert => (
                      <ToggleButton 
                        key={cert}
                        label={cert} 
                        active={(filters as HMIFilterState).certification.includes(cert)} 
                        onClick={() => {
                          const current = (filters as HMIFilterState).certification;
                          handleFilterChange('certification', current.includes(cert) ? current.filter(c => c !== cert) : [...current, cert]);
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {productType === 'Servo' && 'power' in filters && (
              <>
                <MultiSelectFilter 
                  label={t.servoPower} 
                  options={SERVO_POWER_OPTIONS} 
                  selected={(filters as ServoFilterState).power} 
                  onChange={(v) => handleFilterChange('power', v)} 
                  t={t}
                />
                <MultiSelectFilter 
                  label={t.servoControl} 
                  options={SERVO_CONTROL_OPTIONS} 
                  selected={(filters as ServoFilterState).control_method} 
                  onChange={(v) => handleFilterChange('control_method', v)} 
                  t={t}
                />
                <MultiSelectFilter 
                  label={t.servoVoltage} 
                  options={SERVO_VOLTAGE_OPTIONS} 
                  selected={(filters as ServoFilterState).input_voltage} 
                  onChange={(v) => handleFilterChange('input_voltage', v)} 
                  t={t}
                />
                <MultiSelectFilter 
                  label={t.servoEncoderBits} 
                  options={SERVO_ENCODER_BITS} 
                  selected={(filters as ServoFilterState).encoder_bits} 
                  onChange={(v) => handleFilterChange('encoder_bits', v)} 
                  t={t}
                />
                <div className="grid grid-cols-2 gap-4">
                  <MultiSelectFilter 
                    label={t.servoEncoderType} 
                    options={SERVO_ENCODER_TYPES} 
                    selected={(filters as ServoFilterState).encoder_type} 
                    onChange={(v) => handleFilterChange('encoder_type', v)} 
                    t={t}
                  />
                  <MultiSelectFilter 
                    label={t.servoEncoderMode} 
                    options={SERVO_ENCODER_MODES} 
                    selected={(filters as ServoFilterState).encoder_mode} 
                    onChange={(v) => handleFilterChange('encoder_mode', v)} 
                    t={t}
                  />
                </div>
                <MultiSelectFilter 
                  label={t.servoBrake} 
                  options={['Yes', 'No']} 
                  selected={(filters as ServoFilterState).brake} 
                  onChange={(v) => handleFilterChange('brake', v)} 
                  t={t}
                />
              </>
            )}

            <button 
              onClick={executeSearch}
              disabled={loading}
              className="w-full bg-[#141414] text-[#E4E3E0] py-4 font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#141414]/90 transition-all disabled:opacity-50"
            >
              {loading ? t.processing : t.confirmSelection}
              <ChevronRight size={18} />
            </button>
          </div>
        </aside>

        {/* Results Area */}
        <section className="p-4 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {adminMode ? (
              <motion.div 
                key="admin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div>
                    <h2 className="font-serif font-bold text-3xl">{t.masterDatabase}</h2>
                    <p className="text-xs opacity-50 mt-1">{t.fullAccess} (Source: public/MPLC_Product_{language}.json)</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-all"
                    >
                      <Cpu size={14} /> {t.addProduct}
                    </button>
                    <button 
                      onClick={handleSync}
                      disabled={loading}
                      className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-all disabled:opacity-50"
                    >
                      <FileSpreadsheet size={14} /> {t.loadFromJson}
                    </button>
                    <button 
                      onClick={handleSaveToJson}
                      disabled={loading}
                      className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-all disabled:opacity-50"
                    >
                      <FileSpreadsheet size={14} /> {t.saveToJson}
                    </button>
                  </div>
                </div>
                <ProductTable products={allProducts} t={t} type={productType} />
              </motion.div>
            ) : results.length > 0 ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#141414] text-[#E4E3E0] p-3 rounded-full">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h2 className="font-serif font-bold text-3xl">{t.matchResults}</h2>
                      <p className="text-xs opacity-50">{t.foundModels.replace('{count}', results.length.toString())}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowCards(!showCards)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-[#141414] px-4 py-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                  >
                    {showCards ? <><ChevronUp size={14} /> {t.collapse}</> : <><ChevronDown size={14} /> {t.expand}</>}
                  </button>
                </div>

                <AnimatePresence>
                  {showCards && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.map(product => (
                          <div key={product.id} className="border border-[#141414] p-6 bg-white/50 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all group">
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="font-bold text-2xl" style={{ fontFamily: '"PingFang SC", "Helvetica Neue", Arial, sans-serif' }}>{product.model}</h3>
                              <span className="text-[10px] font-mono border border-current px-2 py-0.5 rounded">{productType}</span>
                            </div>
                            <div className="space-y-1 text-xs font-mono opacity-70 group-hover:opacity-100">
                              {productType === 'MPLC' && (
                                <>
                                  <div className="flex justify-between"><span>{t.dio}:</span> <span>{(product as MPLCProduct).dio}</span></div>
                                  <div className="flex justify-between"><span>{t.aio}:</span> <span>{(product as MPLCProduct).aio}</span></div>
                                  <div className="flex justify-between"><span>{t.ecatRealVirtual}:</span> <span>{(product as MPLCProduct).ethercat_real_or_virtual_axes} {t.axes}</span></div>
                                  <div className="flex justify-between"><span>{t.ecatVirtual}:</span> <span>{(product as MPLCProduct).ethercat_virtual_axes} {t.axes}</span></div>
                                </>
                              )}
                              {productType === 'HMI' && (product as HMIProduct).size !== undefined && (
                                <>
                                  <div className="flex justify-between"><span>{t.hmiSize}:</span> <span>{(product as HMIProduct).size}"</span></div>
                                  <div className="flex justify-between"><span>RS485:</span> <span>{(product as HMIProduct).rs485}</span></div>
                                  <div className="flex justify-between"><span>Ethernet:</span> <span>{(product as HMIProduct).ethernet}</span></div>
                                  <div className="flex justify-between"><span>{t.hmiHardware}:</span> <span>{(product as HMIProduct).hardware_config}</span></div>
                                </>
                              )}
                              {productType === 'Servo' && (product as ServoProduct).control_method !== undefined && (
                                <>
                                  <div className="flex justify-between"><span>{t.servoPower}:</span> <span>{(product as ServoProduct).power}</span></div>
                                  <div className="flex justify-between"><span>{t.servoControl}:</span> <span>{(product as ServoProduct).control_method?.join(', ')}</span></div>
                                  <div className="flex justify-between"><span>{t.servoVoltage}:</span> <span>{(product as ServoProduct).input_voltage?.join(', ')}</span></div>
                                  <div className="flex justify-between"><span>{t.servoBrake}:</span> <span>{(product as ServoProduct).brake ? t.yes : t.no}</span></div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-8">
                  <h3 className="text-[10px] uppercase font-bold opacity-50 tracking-widest mb-4">{t.detailedComparison}</h3>
                  <ProductTable products={results} t={t} type={productType} />
                  
                  {/* Notes Section */}
                  <div className="mt-8 p-6 border border-[#141414]/10 bg-white/20">
                    <h4 className="text-[10px] uppercase font-bold opacity-50 tracking-widest mb-4 flex items-center gap-2">
                      <AlertCircle size={14} /> {t.notes}
                    </h4>
                    <ul className="space-y-2 text-[11px] opacity-70 leading-relaxed">
                      {productType === 'MPLC' && (
                        <>
                          <li>{t.note1}</li>
                          <li>{t.note2}</li>
                          <li>{t.note3}</li>
                          <li>{t.note4}</li>
                        </>
                      )}
                      {productType === 'HMI' && (
                        <li className="whitespace-pre-line">{t.hmiNoteText}</li>
                      )}
                      {productType === 'Servo' && (
                        <li className="whitespace-pre-line">{t.servoNoteText}</li>
                      )}
                    </ul>
                  </div>
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
                <p className="font-serif font-bold text-2xl mt-4">{t.awaitingParameters}</p>
                <p className="text-xs uppercase tracking-widest mt-2">{t.adjustFilters}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Language Selection Modal */}
      <AnimatePresence>
        {showLanguageModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#141414] z-[200] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-12"
            >
              <div className="space-y-4">
                <h2 className="font-serif italic text-6xl text-[#E4E3E0]">Product Selector</h2>
                <p className="text-[#E4E3E0]/40 uppercase tracking-[0.3em] text-xs">Industrial Control Selection System</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button 
                  onClick={() => { setLanguage('en'); setShowLanguageModal(false); }}
                  className="group relative px-12 py-6 border border-[#E4E3E0]/20 text-[#E4E3E0] hover:bg-[#E4E3E0] hover:text-[#141414] transition-all duration-500 overflow-hidden"
                >
                  <span className="relative z-10 font-serif italic text-2xl">English</span>
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E4E3E0] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </button>
                <button 
                  onClick={() => { setLanguage('cn'); setShowLanguageModal(false); }}
                  className="group relative px-12 py-6 border border-[#E4E3E0]/20 text-[#E4E3E0] hover:bg-[#E4E3E0] hover:text-[#141414] transition-all duration-500 overflow-hidden"
                >
                  <span className="relative z-10 font-serif font-bold text-2xl">简体中文</span>
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E4E3E0] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

function MultiSelectFilter({ label, options, selected, onChange, t }: { label: string, options: string[], selected: string[], onChange: (v: string[]) => void, t: any }) {
  const translateOption = (opt: string) => {
    if (opt === 'Yes') return t.yes;
    if (opt === 'No') return t.no;
    if (opt === 'Magnetic') return t.magnetic;
    if (opt === 'Optical') return t.optical;
    if (opt === 'Absolute') return t.absolute;
    if (opt === 'Incremental') return t.incremental;
    if (opt === 'Pulse') return t.servoPulse;
    if (opt === 'EtherCAT') return t.ethercat;
    return opt;
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase font-bold opacity-50 tracking-widest block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <ToggleButton 
            key={opt}
            label={translateOption(opt)} 
            active={selected.includes(opt)} 
            onClick={() => {
              onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
            }} 
          />
        ))}
      </div>
    </div>
  );
}

function ProductTable({ products, t, type }: { products: Product[], t: any, type: ProductType }) {
  if (type === 'MPLC') {
    const mplcProducts = products as MPLCProduct[];
    return (
      <div className="border border-[#141414] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#141414] text-[#E4E3E0]">
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.productModel}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.dio}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.aio}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.serial}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.hscPoints}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.pulse}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.ecatRealVirtual}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.ecatVirtual}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.ecam}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs">{t.interpolationSupport}</th>
            </tr>
          </thead>
          <tbody>
            {mplcProducts.map((p, idx) => (
              <tr key={p.id} className={cn("border-b border-[#141414]", idx % 2 === 0 ? "bg-white/30" : "bg-transparent")}>
                <td className="p-2 md:p-4 font-bold text-sm border-r border-[#141414]/10" style={{ fontFamily: '"PingFang SC", "Helvetica Neue", Arial, sans-serif' }}>{p.model}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.dio}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.aio}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.serial_ports}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.hsc_points}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.pulse_axes}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.ethercat_real_or_virtual_axes}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.ethercat_virtual_axes}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.e_cam_axes}</td>
                <td className="p-2 md:p-4">
                  <div className="flex flex-wrap gap-1">
                    {p.pulse_interp_linear && <StatusTag label={`P-${t.linear}`} />}
                    {p.pulse_interp_circular && <StatusTag label={`P-${t.circular}`} />}
                    {p.pulse_interp_fixed && <StatusTag label={`P-${t.fixedLA}`} />}
                    {p.ethercat_interp_linear && <StatusTag label={`E-${t.linear}`} variant="dark" />}
                    {p.ethercat_interp_circular && <StatusTag label={`E-${t.circular}`} variant="dark" />}
                    {p.ethercat_interp_fixed && <StatusTag label={`E-${t.fixedLA}`} variant="dark" />}
                    {p.ethercat_interp_spiral && <StatusTag label={`E-${t.spiral}`} variant="dark" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'HMI') {
    const hmiProducts = products as HMIProduct[];
    return (
      <div className="border border-[#141414] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-[#141414] text-[#E4E3E0]">
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.productModel}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.hmiSize}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">RS485</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.hmiSerial}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">Ethernet</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.hmiHardware}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.hmiCpuFlashRam}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs">{t.hmiCert}</th>
            </tr>
          </thead>
          <tbody>
            {hmiProducts.map((p, idx) => (
              <tr key={p.id} className={cn("border-b border-[#141414]", idx % 2 === 0 ? "bg-white/30" : "bg-transparent")}>
                <td className="p-2 md:p-4 font-bold text-sm border-r border-[#141414]/10">{p.model}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.size}"</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.rs485}</td>
                <td className="p-2 md:p-4 font-mono text-[10px] border-r border-[#141414]/10">{p.serial}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.ethernet}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.hardware_config === 'High' ? t.hmiHigh : t.hmiLow}</td>
                <td className="p-2 md:p-4 font-mono text-[10px] border-r border-[#141414]/10">{p.cpu_flash_ram}</td>
                <td className="p-2 md:p-4">
                  <div className="flex flex-wrap gap-1">
                    {p.certification?.map(c => <StatusTag key={c} label={c} />)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'Servo') {
    const servoProducts = products as ServoProduct[];
    const translateValue = (val: string) => {
      if (val === 'Magnetic') return t.magnetic;
      if (val === 'Optical') return t.optical;
      if (val === 'Absolute') return t.absolute;
      if (val === 'Incremental') return t.incremental;
      if (val === 'Pulse') return t.servoPulse;
      if (val === 'EtherCAT') return t.ethercat;
      return val;
    };

    return (
      <div className="border border-[#141414] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-[#141414] text-[#E4E3E0]">
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.servoPower}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.servoModel}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.servoControl}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.servoVoltage}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.servoMotorModel}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.servoEncoderBits}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.servoEncoderType}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.servoEncoderMode}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.servoBrake}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.servoFlangeSize}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.servoPowerCable}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs border-r border-[#E4E3E0]/20">{t.servoEncoderCable}</th>
              <th className="p-2 md:p-4 font-serif font-bold text-xs">{t.servoBrakeCable}</th>
            </tr>
          </thead>
          <tbody>
            {servoProducts.map((p, idx) => (
              <tr key={p.id} className={cn("border-b border-[#141414]", idx % 2 === 0 ? "bg-white/30" : "bg-transparent")}>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.power}</td>
                <td className="p-2 md:p-4 font-bold text-sm border-r border-[#141414]/10">{p.model}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.control_method?.map(translateValue).join(', ')}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.input_voltage?.join(', ')}</td>
                <td className="p-2 md:p-4 font-mono text-[10px] border-r border-[#141414]/10">{p.motor_model}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.encoder_bits?.join(', ')}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.encoder_type?.map(translateValue).join(', ')}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.encoder_mode?.map(translateValue).join(', ')}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.brake ? t.yes : t.no}</td>
                <td className="p-2 md:p-4 font-mono text-xs border-r border-[#141414]/10">{p.flange_size}</td>
                <td className="p-2 md:p-4 font-mono text-[10px] border-r border-[#141414]/10">{p.power_cable}</td>
                <td className="p-2 md:p-4 font-mono text-[10px] border-r border-[#141414]/10">{p.encoder_cable}</td>
                <td className="p-2 md:p-4 font-mono text-[10px]">{p.brake_cable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
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
