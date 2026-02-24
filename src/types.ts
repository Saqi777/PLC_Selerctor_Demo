export interface Product {
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
}

export interface FilterState {
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
