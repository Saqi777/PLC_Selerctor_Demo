export type ProductType = 'MPLC' | 'HMI' | 'Servo';

export interface MPLCProduct {
  id: number;
  model: string;
  dio: number;
  aio: number;
  serial_ports: number;
  pulse_axes: number;
  ethercat_real_or_virtual_axes: number;
  ethercat_virtual_axes: number;
  pulse_interp_linear: boolean;
  pulse_interp_circular: boolean;
  pulse_interp_fixed: boolean;
  ethercat_interp_linear: boolean;
  ethercat_interp_circular: boolean;
  ethercat_interp_fixed: boolean;
  ethercat_interp_spiral: boolean;
  e_cam_axes: number;
  hsc_points: number;
}

export interface HMIProduct {
  id: number;
  model: string;
  size: string; // 4.3/7/10.1/12/15
  rs485: number; // 1~2
  serial: string; // COM1: RS-232;COM2: RS-422/485;COM3: 485
  ethernet: number; // 0~1
  hardware_config: 'High' | 'Low'; // 高配/低配
  cpu_flash_ram: string; // 32-bit 528MHz / 128MB / 128MB
  certification: string[]; // CE/UL
}

export interface ServoProduct {
  id: number;
  model: string;
  power: string; // 100W/200W/...
  control_method: string[]; // Pulse/EtherCAT
  input_voltage: string[]; // 220V/380V
  motor_model: string; // MA6-010M3060A04B2N
  encoder_bits: string[]; // 17bit/23bit
  encoder_type: string[]; // Magnetic/Optical
  encoder_mode: string[]; // Absolute/Incremental
  brake: boolean;
  flange_size: string; // 40
  power_cable: string; // LA6-PAN0F0-N1M□□
  encoder_cable: string; // LA6-EHN03E-P3M□□
  brake_cable: string; // LA6-PNN2F4-N5M□□
}

export type Product = MPLCProduct | HMIProduct | ServoProduct;

export interface MPLCFilterState {
  dio: number | "";
  aio: number | "";
  serial_ports: number;
  pulse_axes: number;
  ethercat_real_or_virtual_axes: number;
  ethercat_virtual_axes: number;
  pulse_interp_linear: boolean;
  pulse_interp_circular: boolean;
  pulse_interp_fixed: boolean;
  ethercat_interp_linear: boolean;
  ethercat_interp_circular: boolean;
  ethercat_interp_fixed: boolean;
  ethercat_interp_spiral: boolean;
  e_cam_axes: number;
}

export interface HMIFilterState {
  size: string;
  rs485: number | "";
  ethernet: number | "";
  hardware_config: string;
  certification: string[];
}

export interface ServoFilterState {
  power: string[];
  control_method: string[];
  input_voltage: string[];
  encoder_bits: string[];
  encoder_type: string[];
  encoder_mode: string[];
  brake: string[]; // "Yes", "No"
}

export type FilterState = MPLCFilterState | HMIFilterState | ServoFilterState;
