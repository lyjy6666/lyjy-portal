import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ==================== 硬件类型定义 ====================
type HardwareType = 'gpu' | 'cpu' | 'monitor' | 'mobilecpu' | 'headphone' | 'router';

// 硬件类型信息
const hardwareTypeInfo: Record<HardwareType, { name: string; icon: string; benchmark: string }> = {
  gpu: { name: '显卡', icon: 'fa-solid fa-microchip', benchmark: 'RTX 5090 Ti' },
  cpu: { name: '处理器', icon: 'fa-solid fa-cpu', benchmark: 'Ultra 9 285K' },
  monitor: { name: '显示器', icon: 'fa-solid fa-display', benchmark: 'PG32UCDM' },
  mobilecpu: { name: '手机CPU', icon: 'fa-solid fa-mobile-screen', benchmark: '骁龙8 Elite Gen5' },
  headphone: { name: '耳机', icon: 'fa-solid fa-headphones', benchmark: 'HD 800S' },
  router: { name: '路由器', icon: 'fa-solid fa-wifi', benchmark: 'GT-BE98 Pro' },
};

// ==================== 显卡数据类型 ====================
interface GPUData {
  id: number;
  name: string;
  performance: number; // 性能百分比
  brand: 'NVIDIA' | 'AMD' | 'Intel';
  tier: '旗舰' | '高端' | '中端' | '主流' | '入门' | '低端';
  specs: {
    vram: string;
    vramType: string;
    cores: string;
    bandwidth: string;
    tdp: string;
    process: string;
  };
  gaming: {
    p1080: string;
    p2k: string;
    p4k: string;
  };
  price?: string;
  releaseDate: string;
}

// 显卡天梯数据 - 25款显卡
const gpuData: GPUData[] = [
  // ==================== 旗舰级 ====================
  { id: 1, name: 'RTX 5090 Ti', performance: 100, brand: 'NVIDIA', tier: '旗舰',
    specs: { vram: '32GB', vramType: 'GDDR7', cores: '24024', bandwidth: '2016GB/s', tdp: '600W', process: '3nm' },
    gaming: { p1080: '顶级', p2k: '顶级', p4k: '140FPS+' }, price: '￥19999+', releaseDate: '2026年1月' },
  { id: 2, name: 'RTX 5090', performance: 92.59, brand: 'NVIDIA', tier: '旗舰',
    specs: { vram: '32GB', vramType: 'GDDR7', cores: '21760', bandwidth: '1792GB/s', tdp: '575W', process: '5nm' },
    gaming: { p1080: '顶级', p2k: '顶级', p4k: '120FPS+' }, price: '￥16499+', releaseDate: '2025年1月' },
  { id: 3, name: 'RTX 5090 D v2', performance: 87, brand: 'NVIDIA', tier: '旗舰',
    specs: { vram: '24GB', vramType: 'GDDR7', cores: '21760', bandwidth: '1792GB/s', tdp: '575W', process: '5nm' },
    gaming: { p1080: '顶级', p2k: '顶级', p4k: '110FPS+' }, price: '￥16499+', releaseDate: '2026年5月' },
  { id: 4, name: 'RTX 5080 Ti', performance: 86, brand: 'NVIDIA', tier: '旗舰',
    specs: { vram: '16GB', vramType: 'GDDR7', cores: '10752', bandwidth: '960GB/s', tdp: '400W', process: '4nm' },
    gaming: { p1080: '顶级', p2k: '顶级', p4k: '100FPS+' }, price: '￥9999+', releaseDate: '2026年3月' },
  { id: 5, name: 'RTX 5080', performance: 84.62, brand: 'NVIDIA', tier: '旗舰',
    specs: { vram: '16GB', vramType: 'GDDR7', cores: '10752', bandwidth: '960GB/s', tdp: '360W', process: '5nm' },
    gaming: { p1080: '顶级', p2k: '顶级', p4k: '90FPS+' }, price: '￥8299+', releaseDate: '2025年1月' },
  { id: 6, name: 'RTX 4090', performance: 76.92, brand: 'NVIDIA', tier: '旗舰',
    specs: { vram: '24GB', vramType: 'GDDR6X', cores: '16384', bandwidth: '1008GB/s', tdp: '450W', process: '4nm' },
    gaming: { p1080: '顶级', p2k: '顶级', p4k: '80FPS+' }, price: '￥12999+', releaseDate: '2022年10月' },

  // ==================== 高端级 ====================
  { id: 7, name: 'RTX 5070 Ti', performance: 80, brand: 'NVIDIA', tier: '高端',
    specs: { vram: '16GB', vramType: 'GDDR7', cores: '8960', bandwidth: '672GB/s', tdp: '300W', process: '5nm' },
    gaming: { p1080: '顶级', p2k: '顶级', p4k: '65FPS+' }, price: '￥7999+', releaseDate: '2025年2月' },
  { id: 8, name: 'RX 9070 XT', performance: 75, brand: 'AMD', tier: '高端',
    specs: { vram: '16GB', vramType: 'GDDR6', cores: '4096', bandwidth: '512GB/s', tdp: '260W', process: '4nm' },
    gaming: { p1080: '顶级', p2k: '高', p4k: '55FPS+' }, price: '￥4299+', releaseDate: '2025年3月' },
  { id: 9, name: 'RTX 4080 SUPER', performance: 68.46, brand: 'NVIDIA', tier: '高端',
    specs: { vram: '16GB', vramType: 'GDDR6X', cores: '10240', bandwidth: '736GB/s', tdp: '320W', process: '4nm' },
    gaming: { p1080: '顶级', p2k: '高', p4k: '60FPS+' }, price: '￥7499+', releaseDate: '2024年1月' },
  { id: 10, name: 'RTX 4080', performance: 63.85, brand: 'NVIDIA', tier: '高端',
    specs: { vram: '16GB', vramType: 'GDDR6X', cores: '9728', bandwidth: '717GB/s', tdp: '320W', process: '4nm' },
    gaming: { p1080: '顶级', p2k: '高', p4k: '55FPS+' }, price: '￥6999+', releaseDate: '2022年11月' },

  // ==================== 中端级 ====================
  { id: 11, name: 'RTX 5070', performance: 62, brand: 'NVIDIA', tier: '中端',
    specs: { vram: '12GB', vramType: 'GDDR7', cores: '6144', bandwidth: '448GB/s', tdp: '250W', process: '5nm' },
    gaming: { p1080: '顶级', p2k: '高', p4k: '50FPS+' }, price: '￥5299+', releaseDate: '2025年2月' },
  { id: 12, name: 'RX 9070 GRE', performance: 61.54, brand: 'AMD', tier: '中端',
    specs: { vram: '12GB', vramType: 'GDDR6', cores: '3072', bandwidth: '432GB/s', tdp: '220W', process: '4nm' },
    gaming: { p1080: '顶级', p2k: '高', p4k: '50FPS+' }, price: '￥3699+', releaseDate: '2025年3月' },
  { id: 13, name: 'RX 7900 XTX', performance: 61.54, brand: 'AMD', tier: '中端',
    specs: { vram: '24GB', vramType: 'GDDR6', cores: '6144', bandwidth: '960GB/s', tdp: '355W', process: '5nm' },
    gaming: { p1080: '顶级', p2k: '高', p4k: '50FPS+' }, price: '￥6499+', releaseDate: '2022年12月' },
  { id: 14, name: 'RTX 5060 Ti 16GB', performance: 55, brand: 'NVIDIA', tier: '中端',
    specs: { vram: '16GB', vramType: 'GDDR7', cores: '4608', bandwidth: '320GB/s', tdp: '180W', process: '5nm' },
    gaming: { p1080: '高', p2k: '高', p4k: '40FPS+' }, price: '￥3800+', releaseDate: '2025年3月' },
  { id: 15, name: 'RX 9060 XT 16GB', performance: 53, brand: 'AMD', tier: '中端',
    specs: { vram: '16GB', vramType: 'GDDR6', cores: '2048', bandwidth: '288GB/s', tdp: '160W', process: '4nm' },
    gaming: { p1080: '高', p2k: '高', p4k: '38FPS+' }, price: '￥2200+', releaseDate: '2025年6月' },
  { id: 16, name: 'RTX 5060 Ti 8GB', performance: 52, brand: 'NVIDIA', tier: '中端',
    specs: { vram: '8GB', vramType: 'GDDR7', cores: '4608', bandwidth: '320GB/s', tdp: '180W', process: '5nm' },
    gaming: { p1080: '高', p2k: '中', p4k: '35FPS+' }, price: '￥2749+', releaseDate: '2025年3月' },
  { id: 17, name: 'RX 9060 XT 8GB', performance: 50, brand: 'AMD', tier: '中端',
    specs: { vram: '8GB', vramType: 'GDDR6', cores: '2048', bandwidth: '288GB/s', tdp: '160W', process: '4nm' },
    gaming: { p1080: '高', p2k: '中', p4k: '32FPS+' }, price: '￥1999+', releaseDate: '2025年6月' },

  // ==================== 主流级 ====================
  { id: 18, name: 'RTX 4070 Ti SUPER', performance: 57.69, brand: 'NVIDIA', tier: '主流',
    specs: { vram: '16GB', vramType: 'GDDR6X', cores: '8448', bandwidth: '512GB/s', tdp: '285W', process: '4nm' },
    gaming: { p1080: '顶级', p2k: '高', p4k: '45FPS+' }, price: '￥5499+', releaseDate: '2024年1月' },
  { id: 19, name: 'RX 7900 XT', performance: 57.69, brand: 'AMD', tier: '主流',
    specs: { vram: '20GB', vramType: 'GDDR6', cores: '5376', bandwidth: '800GB/s', tdp: '315W', process: '5nm' },
    gaming: { p1080: '顶级', p2k: '高', p4k: '45FPS+' }, price: '￥5499+', releaseDate: '2022年12月' },
  { id: 20, name: 'RTX 4070 SUPER', performance: 52.31, brand: 'NVIDIA', tier: '主流',
    specs: { vram: '12GB', vramType: 'GDDR6X', cores: '7168', bandwidth: '504GB/s', tdp: '220W', process: '4nm' },
    gaming: { p1080: '高', p2k: '高', p4k: '40FPS+' }, price: '￥4199+', releaseDate: '2024年1月' },
  { id: 21, name: 'RTX 5060', performance: 46, brand: 'NVIDIA', tier: '主流',
    specs: { vram: '8GB', vramType: 'GDDR7', cores: '3840', bandwidth: '256GB/s', tdp: '150W', process: '5nm' },
    gaming: { p1080: '高', p2k: '中', p4k: '25FPS+' }, price: '￥2199+', releaseDate: '2026年3月' },
  { id: 22, name: 'RTX 4070', performance: 44.62, brand: 'NVIDIA', tier: '主流',
    specs: { vram: '12GB', vramType: 'GDDR6X', cores: '5888', bandwidth: '504GB/s', tdp: '200W', process: '4nm' },
    gaming: { p1080: '高', p2k: '高', p4k: '35FPS+' }, price: '￥3499+', releaseDate: '2023年4月' },

  // ==================== 入门级 ====================
  { id: 23, name: 'RTX 4060 Ti', performance: 42, brand: 'NVIDIA', tier: '入门',
    specs: { vram: '8GB', vramType: 'GDDR6', cores: '4352', bandwidth: '288GB/s', tdp: '160W', process: '5nm' },
    gaming: { p1080: '高', p2k: '中', p4k: '25FPS+' }, price: '￥3199+', releaseDate: '2023年5月' },
  { id: 24, name: 'RTX 4060', performance: 38, brand: 'NVIDIA', tier: '入门',
    specs: { vram: '8GB', vramType: 'GDDR6', cores: '3072', bandwidth: '272GB/s', tdp: '115W', process: '5nm' },
    gaming: { p1080: '中', p2k: '中', p4k: '20FPS+' }, price: '￥2499+', releaseDate: '2023年6月' },
  { id: 25, name: 'RX 7600', performance: 35, brand: 'AMD', tier: '入门',
    specs: { vram: '8GB', vramType: 'GDDR6', cores: '2048', bandwidth: '288GB/s', tdp: '190W', process: '6nm' },
    gaming: { p1080: '中', p2k: '低', p4k: '18FPS+' }, price: '￥2099+', releaseDate: '2023年5月' },
];

// ==================== 处理器数据类型 ====================
interface CPUData {
  id: number;
  name: string;
  performance: number;
  brand: 'Intel' | 'AMD' | 'Apple';
  tier: '旗舰' | '高端' | '中端' | '主流' | '入门' | '低端';
  cores: number;
  threads: number;
  baseClock: string;
  boostClock: string;
  cache: string;
  tdp: string;
  process: string;
  price?: string;
  releaseDate: string;
}

// 处理器天梯数据 - 18款桌面处理器
const cpuData: CPUData[] = [
  // ==================== 旗舰级 ====================
  { id: 1, name: 'Core Ultra 9 285K', performance: 100, brand: 'Intel', tier: '旗舰',
    cores: 24, threads: 24, baseClock: '4.1GHz', boostClock: '5.7GHz', cache: '36MB', tdp: '125W', process: 'TSMC N3B',
    price: '￥4799+', releaseDate: '2024年10月' },
  { id: 2, name: 'Ryzen 9 9950X3D', performance: 98, brand: 'AMD', tier: '旗舰',
    cores: 16, threads: 32, baseClock: '4.0GHz', boostClock: '5.7GHz', cache: '144MB', tdp: '170W', process: '4nm',
    price: '￥6999+', releaseDate: '2025年1月' },
  { id: 3, name: 'Ryzen 9 9850X3D', performance: 95, brand: 'AMD', tier: '旗舰',
    cores: 16, threads: 32, baseClock: '4.0GHz', boostClock: '5.7GHz', cache: '144MB', tdp: '170W', process: '4nm',
    price: '￥5999+', releaseDate: '2025年4月' },
  { id: 4, name: 'Ryzen 9 9950X', performance: 92, brand: 'AMD', tier: '旗舰',
    cores: 16, threads: 32, baseClock: '4.3GHz', boostClock: '5.7GHz', cache: '80MB', tdp: '170W', process: '4nm',
    price: '￥5499+', releaseDate: '2024年8月' },

  // ==================== 高端级 ====================
  { id: 5, name: 'Ryzen 9 9800X3D', performance: 88, brand: 'AMD', tier: '高端',
    cores: 8, threads: 16, baseClock: '4.7GHz', boostClock: '5.7GHz', cache: '104MB', tdp: '120W', process: '4nm',
    price: '￥3299+', releaseDate: '2024年11月' },
  { id: 6, name: 'Ryzen 9 7950X3D', performance: 85, brand: 'AMD', tier: '高端',
    cores: 16, threads: 32, baseClock: '4.2GHz', boostClock: '5.7GHz', cache: '144MB', tdp: '120W', process: '5nm',
    price: '￥4999+', releaseDate: '2023年1月' },
  { id: 7, name: 'Ryzen 9 7950X', performance: 82, brand: 'AMD', tier: '高端',
    cores: 16, threads: 32, baseClock: '4.5GHz', boostClock: '5.7GHz', cache: '64MB', tdp: '170W', process: '5nm',
    price: '￥3599+', releaseDate: '2022年9月' },
  { id: 8, name: 'Core Ultra 7 265K', performance: 80, brand: 'Intel', tier: '高端',
    cores: 20, threads: 20, baseClock: '3.8GHz', boostClock: '5.5GHz', cache: '33MB', tdp: '125W', process: 'TSMC N3B',
    price: '￥3499+', releaseDate: '2024年10月' },
  { id: 9, name: 'Core i9-14900K', performance: 78, brand: 'Intel', tier: '高端',
    cores: 24, threads: 32, baseClock: '3.2GHz', boostClock: '6.0GHz', cache: '36MB', tdp: '125W', process: 'Intel 7',
    price: '￥4599+', releaseDate: '2023年10月' },

  // ==================== 中端级 ====================
  { id: 10, name: 'Ryzen 7 7800X3D', performance: 72, brand: 'AMD', tier: '中端',
    cores: 8, threads: 16, baseClock: '4.2GHz', boostClock: '5.2GHz', cache: '104MB', tdp: '120W', process: '5nm',
    price: '￥2799+', releaseDate: '2023年1月' },
  { id: 11, name: 'Ryzen 7 9700X', performance: 70, brand: 'AMD', tier: '中端',
    cores: 8, threads: 16, baseClock: '3.8GHz', boostClock: '5.5GHz', cache: '40MB', tdp: '65W', process: '4nm',
    price: '￥2299+', releaseDate: '2024年8月' },
  { id: 12, name: 'Ryzen 5 9600X', performance: 60, brand: 'AMD', tier: '中端',
    cores: 6, threads: 12, baseClock: '3.9GHz', boostClock: '5.4GHz', cache: '38MB', tdp: '65W', process: '4nm',
    price: '￥1699+', releaseDate: '2024年8月' },
  { id: 13, name: 'Core Ultra 5 245K', performance: 58, brand: 'Intel', tier: '中端',
    cores: 14, threads: 14, baseClock: '3.6GHz', boostClock: '5.2GHz', cache: '24MB', tdp: '125W', process: 'TSMC N3B',
    price: '￥2299+', releaseDate: '2024年10月' },
  { id: 14, name: 'Core i5-14600K', performance: 56, brand: 'Intel', tier: '中端',
    cores: 14, threads: 20, baseClock: '3.5GHz', boostClock: '5.3GHz', cache: '24MB', tdp: '125W', process: 'Intel 7',
    price: '￥2499+', releaseDate: '2023年10月' },
  { id: 15, name: 'Ryzen 5 7600X', performance: 55, brand: 'AMD', tier: '中端',
    cores: 6, threads: 12, baseClock: '4.7GHz', boostClock: '5.3GHz', cache: '38MB', tdp: '105W', process: '5nm',
    price: '￥1399+', releaseDate: '2023年1月' },

  // ==================== 主流级 ====================
  { id: 16, name: 'Core i5-13600K', performance: 52, brand: 'Intel', tier: '主流',
    cores: 14, threads: 20, baseClock: '3.5GHz', boostClock: '5.1GHz', cache: '24MB', tdp: '125W', process: 'Intel 7',
    price: '￥2199+', releaseDate: '2022年10月' },
  { id: 17, name: 'Ryzen 5 7500F', performance: 45, brand: 'AMD', tier: '主流',
    cores: 6, threads: 12, baseClock: '3.7GHz', boostClock: '5.0GHz', cache: '38MB', tdp: '65W', process: '5nm',
    price: '￥999+', releaseDate: '2023年7月' },
  { id: 18, name: 'Core i5-12600K', performance: 42, brand: 'Intel', tier: '主流',
    cores: 10, threads: 16, baseClock: '3.7GHz', boostClock: '4.9GHz', cache: '20MB', tdp: '125W', process: 'Intel 7',
    price: '￥1299+', releaseDate: '2021年11月' },
];

// ==================== 显示器数据类型 ====================
interface MonitorData {
  id: number;
  name: string;
  performance: number;
  brand: string;
  tier: '旗舰' | '高端' | '中端' | '主流' | '入门';
  specs: {
    size: string;
    resolution: string;
    refreshRate: string;
    panelType: string;
    responseTime: string;
    colorGamut: string;
  };
  price?: string;
  releaseDate: string;
}

// 显示器天梯数据 - 8款
const monitorData: MonitorData[] = [
  // ==================== 旗舰级 ====================
  { id: 1, name: '华硕 PG32UCDM', performance: 100, brand: '华硕', tier: '旗舰',
    specs: { size: '32英寸', resolution: '4K 3840×2160', refreshRate: '240Hz', panelType: 'QD-OLED', responseTime: '0.03ms', colorGamut: '99% DCI-P3' },
    price: '￥12999+', releaseDate: '2024年1月' },
  { id: 2, name: '三星 Odyssey G8 OLED', performance: 95, brand: '三星', tier: '旗舰',
    specs: { size: '34英寸', resolution: '3440×1440', refreshRate: '175Hz', panelType: 'QD-OLED', responseTime: '0.03ms', colorGamut: '99% DCI-P3' },
    price: '￥8999+', releaseDate: '2024年' },
  { id: 3, name: 'LG 32GQ950', performance: 90, brand: 'LG', tier: '旗舰',
    specs: { size: '32英寸', resolution: '4K 3840×2160', refreshRate: '160Hz', panelType: 'Nano IPS', responseTime: '1ms', colorGamut: '98% DCI-P3' },
    price: '￥7999+', releaseDate: '2024年' },

  // ==================== 高端级 ====================
  { id: 4, name: '戴尔 Alienware AW3423DWF', performance: 88, brand: '外星人', tier: '高端',
    specs: { size: '34英寸', resolution: '3440×1440', refreshRate: '165Hz', panelType: 'QD-OLED', responseTime: '0.03ms', colorGamut: '99% DCI-P3' },
    price: '￥7499+', releaseDate: '2024年' },
  { id: 5, name: '索尼 INZONE M9 II', performance: 85, brand: '索尼', tier: '高端',
    specs: { size: '27英寸', resolution: '4K 3840×2160', refreshRate: '160Hz', panelType: 'IPS', responseTime: '1ms', colorGamut: '95% DCI-P3' },
    price: '￥5999+', releaseDate: '2024年' },

  // ==================== 中端级 ====================
  { id: 6, name: 'AOC AGON PRO AG274QZM', performance: 75, brand: 'AOC', tier: '中端',
    specs: { size: '27英寸', resolution: '2K 2560×1440', refreshRate: '240Hz', panelType: 'IPS', responseTime: '1ms', colorGamut: '98% DCI-P3' },
    price: '￥4499+', releaseDate: '2024年' },
  { id: 7, name: '小米显示器 27 4K', performance: 65, brand: '小米', tier: '中端',
    specs: { size: '27英寸', resolution: '4K 3840×2160', refreshRate: '60Hz', panelType: 'IPS', responseTime: '4ms', colorGamut: '95% DCI-P3' },
    price: '￥1599+', releaseDate: '2024年' },

  // ==================== 主流级 ====================
  { id: 8, name: 'HKC PG27P5U', performance: 60, brand: '惠科', tier: '主流',
    specs: { size: '27英寸', resolution: '4K 3840×2160', refreshRate: '144Hz', panelType: 'IPS', responseTime: '1ms', colorGamut: '95% DCI-P3' },
    price: '￥2499+', releaseDate: '2024年' },
];

// ==================== 手机CPU数据类型 ====================
interface MobileCPUData {
  id: number;
  name: string;
  performance: number;
  brand: string;
  tier: '旗舰' | '高端' | '中端' | '入门';
  specs: {
    process: string;
    cpuCores: string;
    gpu: string;
    aiScore: string;
  };
  devices?: string;
  price?: string;
  releaseDate: string;
}

// 手机CPU天梯数据 - 17款
const mobileCPUData: MobileCPUData[] = [
  // ==================== 旗舰级 ====================
  { id: 1, name: '骁龙8 Elite Gen5', performance: 100, brand: '高通', tier: '旗舰',
    specs: { process: '3nm', cpuCores: '8核', gpu: 'Adreno 840', aiScore: '安兔兔约440万' },
    devices: '三星S26系列、小米16 Pro', releaseDate: '2025年10月' },
  { id: 2, name: '苹果 A19 Pro', performance: 96, brand: 'Apple', tier: '旗舰',
    specs: { process: '3nm', cpuCores: '6核 (2P+4E)', gpu: '6核GPU', aiScore: '安兔兔约420万' },
    devices: 'iPhone 17 Pro系列', releaseDate: '2025年9月' },
  { id: 3, name: '天玑 9500', performance: 93, brand: '联发科', tier: '旗舰',
    specs: { process: '3nm', cpuCores: '8核 (全大核)', gpu: 'Immortalis-G930', aiScore: '安兔兔约410万' },
    devices: 'vivo X300 Pro、OPPO Find X9', releaseDate: '2025年10月' },
  { id: 4, name: '苹果 A19', performance: 90, brand: 'Apple', tier: '旗舰',
    specs: { process: '3nm', cpuCores: '6核 (2P+4E)', gpu: '5核GPU', aiScore: '安兔兔约400万' },
    devices: 'iPhone 17系列', releaseDate: '2025年9月' },

  // ==================== 高端级 ====================
  { id: 5, name: '骁龙8 Elite', performance: 85, brand: '高通', tier: '高端',
    specs: { process: '3nm', cpuCores: '8核', gpu: 'Adreno 830', aiScore: '安兔兔约360万' },
    devices: '小米15、一加13', releaseDate: '2024年10月' },
  { id: 6, name: '苹果 A18 Pro', performance: 82, brand: 'Apple', tier: '高端',
    specs: { process: '3nm', cpuCores: '6核 (2P+4E)', gpu: '6核GPU', aiScore: '安兔兔约340万' },
    devices: 'iPhone 16 Pro系列', releaseDate: '2024年9月' },
  { id: 7, name: '玄戒 O1', performance: 80, brand: '小米', tier: '高端',
    specs: { process: '3nm', cpuCores: '10核', gpu: 'IMG DXT', aiScore: '安兔兔约330万' },
    devices: '小米15S Pro、小米平板7S Pro', releaseDate: '2025年5月' },
  { id: 8, name: '骁龙8 Gen5', performance: 78, brand: '高通', tier: '高端',
    specs: { process: '3nm', cpuCores: '8核', gpu: 'Adreno 830', aiScore: '安兔兔约320万' },
    devices: '三星S25系列、小米15', releaseDate: '2024年10月' },
  { id: 9, name: '苹果 A18', performance: 76, brand: 'Apple', tier: '高端',
    specs: { process: '3nm', cpuCores: '6核 (2P+4E)', gpu: '5核GPU', aiScore: '安兔兔约310万' },
    devices: 'iPhone 16系列', releaseDate: '2024年9月' },

  // ==================== 中端级 ====================
  { id: 10, name: '天玑 9400', performance: 72, brand: '联发科', tier: '中端',
    specs: { process: '3nm', cpuCores: '8核 (全大核)', gpu: 'Immortalis-G925', aiScore: '安兔兔约300万' },
    devices: 'vivo X200 Pro、OPPO Find X8', releaseDate: '2024年10月' },
  { id: 11, name: '苹果 A17 Pro', performance: 70, brand: 'Apple', tier: '中端',
    specs: { process: '3nm', cpuCores: '6核 (2P+4E)', gpu: '6核GPU', aiScore: '安兔兔约295万' },
    devices: 'iPhone 15 Pro系列', releaseDate: '2023年9月' },
  { id: 12, name: '骁龙8 Gen3', performance: 68, brand: '高通', tier: '中端',
    specs: { process: '4nm', cpuCores: '8核', gpu: 'Adreno 750', aiScore: '安兔兔约290万' },
    devices: '小米14、Galaxy S24', releaseDate: '2023年10月' },
  { id: 13, name: '天玑 9300+', performance: 65, brand: '联发科', tier: '中端',
    specs: { process: '4nm', cpuCores: '8核 (全大核)', gpu: 'Immortalis-G720', aiScore: '安兔兔约280万' },
    devices: 'vivo X100s、iQOO Neo9S Pro', releaseDate: '2024年5月' },
  { id: 14, name: '麒麟 9020', performance: 60, brand: '华为', tier: '中端',
    specs: { process: '7nm', cpuCores: '8核', gpu: 'Maleoon 920', aiScore: '安兔兔约260万' },
    devices: '华为Mate 70系列', releaseDate: '2024年11月' },

  // ==================== 主流级 ====================
  { id: 15, name: '天玑 8400', performance: 50, brand: '联发科', tier: '入门',
    specs: { process: '4nm', cpuCores: '8核', gpu: 'Mali-G615', aiScore: '安兔兔约240万' },
    devices: 'Redmi Turbo 4、iQOO Z9 Turbo', releaseDate: '2024年12月' },
  { id: 16, name: '骁龙7+ Gen3', performance: 48, brand: '高通', tier: '入门',
    specs: { process: '4nm', cpuCores: '8核', gpu: 'Adreno 732', aiScore: '安兔兔约230万' },
    devices: '一加Ace 3V、真我GT Neo6', releaseDate: '2024年3月' },
  { id: 17, name: '天玑 8300', performance: 45, brand: '联发科', tier: '入门',
    specs: { process: '4nm', cpuCores: '8核', gpu: 'Mali-G615', aiScore: '安兔兔约220万' },
    devices: 'Redmi K70E', releaseDate: '2023年11月' },
];

// ==================== 耳机数据类型 ====================
interface HeadphoneData {
  id: number;
  name: string;
  performance: number;
  brand: string;
  tier: '旗舰' | '高端' | '中端' | '主流' | '入门';
  specs: {
    type: string;
    driver: string;
    impedance: string;
    sensitivity: string;
    connectivity: string;
  };
  price?: string;
  releaseDate: string;
}

// 耳机天梯数据 - 8款
const headphoneData: HeadphoneData[] = [
  // ==================== 旗舰级 ====================
  { id: 1, name: 'Sennheiser HD 800S', performance: 100, brand: '森海塞尔', tier: '旗舰',
    specs: { type: '开放式头戴', driver: '56mm动圈', impedance: '300Ω', sensitivity: '102dB', connectivity: '有线' },
    price: '￥18999+', releaseDate: '2015年12月' },
  { id: 2, name: 'Sony WH-1000XM6', performance: 95, brand: '索尼', tier: '旗舰',
    specs: { type: '封闭式头戴', driver: '30mm碳纤维动圈', impedance: '-', sensitivity: '-', connectivity: '蓝牙5.3' },
    price: '￥2999+', releaseDate: '2025年8月' },
  { id: 3, name: 'Apple AirPods Max 2', performance: 92, brand: 'Apple', tier: '旗舰',
    specs: { type: '封闭式头戴', driver: '40mm动圈', impedance: '-', sensitivity: '-', connectivity: '蓝牙5.3' },
    price: '￥4399+', releaseDate: '2025年' },

  // ==================== 高端级 ====================
  { id: 4, name: 'Sennheiser Momentum 5', performance: 88, brand: '森海塞尔', tier: '高端',
    specs: { type: '封闭式头戴', driver: '42mm动圈', impedance: '-', sensitivity: '-', connectivity: '蓝牙5.3' },
    price: '￥2499+', releaseDate: '2025年' },
  { id: 5, name: 'Bowers & Wilkins Px8', performance: 85, brand: '宝华韦健', tier: '高端',
    specs: { type: '封闭式头戴', driver: '40mm动圈', impedance: '-', sensitivity: '-', connectivity: '蓝牙5.2' },
    price: '￥4999+', releaseDate: '2024年' },
  { id: 6, name: 'Beyerdynamic DT 900 Pro X', performance: 80, brand: '拜雅', tier: '高端',
    specs: { type: '开放式头戴', driver: 'Tesla动圈', impedance: '48Ω', sensitivity: '104dB', connectivity: '有线' },
    price: '￥2999+', releaseDate: '2021年' },

  // ==================== 主流级 ====================
  { id: 7, name: 'Sony WH-CH720N', performance: 60, brand: '索尼', tier: '主流',
    specs: { type: '封闭式头戴', driver: '30mm动圈', impedance: '-', sensitivity: '-', connectivity: '蓝牙5.2' },
    price: '￥799+', releaseDate: '2023年1月' },
  { id: 8, name: 'Edifier NeoBuds Pro 2', performance: 55, brand: '漫步者', tier: '主流',
    specs: { type: '入耳式TWS', driver: '动圈+动铁', impedance: '-', sensitivity: '-', connectivity: '蓝牙5.3' },
    price: '￥499+', releaseDate: '2024年' },
];

// ==================== 路由器数据类型 ====================
interface RouterData {
  id: number;
  name: string;
  performance: number;
  brand: string;
  tier: '旗舰' | '高端' | '中端' | '主流' | '入门';
  specs: {
    wifiStandard: string;
    maxSpeed: string;
    bands: string;
    ports: string;
    cpu: string;
    antennas: string;
  };
  price?: string;
  releaseDate: string;
}

// 路由器天梯数据 - 8款
const routerData: RouterData[] = [
  // ==================== 旗舰级 ====================
  { id: 1, name: 'ASUS ROG Rapture GT-BE98 Pro', performance: 100, brand: '华硕', tier: '旗舰',
    specs: { wifiStandard: 'WiFi 7', maxSpeed: '46Gbps', bands: '四频', ports: '10G×4 + 2.5G×2', cpu: '四核2.6GHz', antennas: '8根外置' },
    price: '￥7999+', releaseDate: '2024年1月' },
  { id: 2, name: 'Netgear Nighthawk RS700', performance: 95, brand: '网件', tier: '旗舰',
    specs: { wifiStandard: 'WiFi 7', maxSpeed: '19Gbps', bands: '三频', ports: '10G×1 + 2.5G×4', cpu: '四核2.2GHz', antennas: '内置' },
    price: '￥5999+', releaseDate: '2024年' },
  { id: 3, name: 'ASUS RT-BE96U', performance: 90, brand: '华硕', tier: '旗舰',
    specs: { wifiStandard: 'WiFi 7', maxSpeed: '19Gbps', bands: '三频', ports: '10G×1 + 2.5G×2', cpu: '四核2.6GHz', antennas: '内置' },
    price: '￥3999+', releaseDate: '2024年' },

  // ==================== 高端级 ====================
  { id: 4, name: 'TP-Link Archer BE800', performance: 85, brand: 'TP-Link', tier: '高端',
    specs: { wifiStandard: 'WiFi 7', maxSpeed: '19Gbps', bands: '三频', ports: '10G×1 + 2.5G×4', cpu: '四核2.0GHz', antennas: '内置' },
    price: '￥2999+', releaseDate: '2024年' },

  // ==================== 中端级 ====================
  { id: 5, name: 'Xiaomi Router BE7000', performance: 75, brand: '小米', tier: '中端',
    specs: { wifiStandard: 'WiFi 7', maxSpeed: '19Gbps', bands: '三频', ports: '10G×2 + 2.5G×4', cpu: '四核1.5GHz', antennas: '内置' },
    price: '￥1999+', releaseDate: '2024年1月' },
  { id: 6, name: '华为路由 BE7 Pro', performance: 70, brand: '华为', tier: '中端',
    specs: { wifiStandard: 'WiFi 7', maxSpeed: '19Gbps', bands: '双频', ports: '2.5G×1 + 1G×3', cpu: '四核1.5GHz', antennas: '内置' },
    price: '￥799+', releaseDate: '2024年' },

  // ==================== 主流级 ====================
  { id: 7, name: 'TP-Link Archer AX73', performance: 60, brand: 'TP-Link', tier: '主流',
    specs: { wifiStandard: 'WiFi 6', maxSpeed: '5.4Gbps', bands: '双频', ports: '1G×4', cpu: '双核1.5GHz', antennas: '6根外置' },
    price: '￥499+', releaseDate: '2023年' },
  { id: 8, name: 'Xiaomi Router AX6000', performance: 55, brand: '小米', tier: '主流',
    specs: { wifiStandard: 'WiFi 6', maxSpeed: '6Gbps', bands: '双频', ports: '2.5G×1 + 1G×3', cpu: '四核1.0GHz', antennas: '内置' },
    price: '￥599+', releaseDate: '2020年12月' },
];

// 品牌颜色映射
const brandColorsMap: Record<string, { bg: string; text: string; border: string }> = {
  // 显卡品牌
  NVIDIA: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  // 处理器品牌
  Intel: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  AMD: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  Apple: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' },
  // 手机CPU品牌
  高通: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
  联发科: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
  // 显示器/耳机/路由器品牌
  华硕: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  三星: { bg: 'bg-blue-400/20', text: 'text-blue-400', border: 'border-blue-400/50' },
  LG: { bg: 'bg-red-400/20', text: 'text-red-400', border: 'border-red-400/50' },
  戴尔: { bg: 'bg-blue-600/20', text: 'text-blue-400', border: 'border-blue-600/50' },
  外星人: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  明基: { bg: 'bg-purple-400/20', text: 'text-purple-400', border: 'border-purple-400/50' },
  技嘉: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
  AOC: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/50' },
  微星: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  小米: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
  红米: { bg: 'bg-orange-400/20', text: 'text-orange-400', border: 'border-orange-400/50' },
  惠科: { bg: 'bg-green-400/20', text: 'text-green-400', border: 'border-green-400/50' },
  SANC: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/50' },
  联想: { bg: 'bg-red-400/20', text: 'text-red-400', border: 'border-red-400/50' },
  // 耳机品牌
  森海塞尔: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  HIFIMAN: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
  Audeze: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50' },
  Focal: { bg: 'bg-blue-400/20', text: 'text-blue-400', border: 'border-blue-400/50' },
  索尼: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/50' },
  拜雅: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
  铁三角: { bg: 'bg-red-400/20', text: 'text-red-400', border: 'border-red-400/50' },
  万魔: { bg: 'bg-orange-400/20', text: 'text-orange-400', border: 'border-orange-400/50' },
  漫步者: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  QCY: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/50' },
  金士顿: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  // 路由器品牌
  网件: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  'TP-Link': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/50' },
  新华三: { bg: 'bg-blue-400/20', text: 'text-blue-400', border: 'border-blue-400/50' },
};

// 获取品牌颜色
const getBrandColors = (brand: string) => {
  return brandColorsMap[brand] || { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' };
};

// 定位颜色映射
const tierColors: Record<string, string> = {
  '旗舰': 'from-yellow-500 to-orange-500',
  '高端': 'from-purple-500 to-pink-500',
  '中端': 'from-blue-500 to-cyan-500',
  '主流': 'from-green-500 to-emerald-500',
  '入门': 'from-gray-400 to-gray-500',
  '低端': 'from-gray-500 to-gray-600',
};

interface GPUTierChartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GPUTierChart({ isOpen, onClose }: GPUTierChartProps) {
  const [type, setType] = useState<HardwareType>('gpu');
  const [selectedGPU, setSelectedGPU] = useState<GPUData | null>(null);
  const [selectedCPU, setSelectedCPU] = useState<CPUData | null>(null);
  const [selectedMonitor, setSelectedMonitor] = useState<MonitorData | null>(null);
  const [selectedMobileCPU, setSelectedMobileCPU] = useState<MobileCPUData | null>(null);
  const [selectedHeadphone, setSelectedHeadphone] = useState<HeadphoneData | null>(null);
  const [selectedRouter, setSelectedRouter] = useState<RouterData | null>(null);
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 获取当前类型的数据
  const getCurrentData = () => {
    switch (type) {
      case 'gpu': return gpuData;
      case 'cpu': return cpuData;
      case 'monitor': return monitorData;
      case 'mobilecpu': return mobileCPUData;
      case 'headphone': return headphoneData;
      case 'router': return routerData;
      default: return gpuData;
    }
  };

  // 获取所有品牌
  const getAllBrands = () => {
    const data = getCurrentData();
    const brands = [...new Set(data.map(item => item.brand))];
    return ['all', ...brands];
  };

  // 过滤并按性能排序
  const getFilteredData = () => {
    const data = getCurrentData();
    return data
      .filter((item: any) => {
        const brandMatch = filterBrand === 'all' || item.brand === filterBrand;
        const tierMatch = filterTier === 'all' || item.tier === filterTier;
        return brandMatch && tierMatch;
      })
      .sort((a: any, b: any) => b.performance - a.performance);
  };

  // 清除选中状态
  const clearSelection = () => {
    setSelectedGPU(null);
    setSelectedCPU(null);
    setSelectedMonitor(null);
    setSelectedMobileCPU(null);
    setSelectedHeadphone(null);
    setSelectedRouter(null);
  };

  // 关闭时重置
  useEffect(() => {
    if (!isOpen) {
      clearSelection();
      setFilterBrand('all');
      setFilterTier('all');
      setType('gpu');
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 主容器 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-2xl border border-white/10 w-full max-w-5xl h-[85vh] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/30">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-chart-line text-2xl text-blue-400"></i>
                <h3 className="text-white text-xl font-bold">天梯图 2026</h3>
                <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">
                  {hardwareTypeInfo[type].benchmark} = 100% | 共{getCurrentData().length}款
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors p-2"
                aria-label="关闭"
              >
                <i className="fa-solid fa-times text-lg"></i>
              </button>
            </div>
            
            {/* 类型和品牌筛选栏 */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-white/10 bg-black/20">
              {/* 类型切换 */}
              <div className="flex gap-1 bg-black/30 rounded-lg p-1 overflow-x-auto">
                {(Object.keys(hardwareTypeInfo) as HardwareType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => { setType(t); setFilterBrand('all'); clearSelection(); scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      type === t ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <i className={hardwareTypeInfo[t].icon}></i>
                    {hardwareTypeInfo[t].name}
                  </button>
                ))}
              </div>
              
              {/* 品牌筛选 */}
              <div className="flex gap-1 bg-black/30 rounded-lg p-1 overflow-x-auto max-w-[240px]">
                {getAllBrands().slice(0, 6).map(brand => (
                  <button
                    key={brand}
                    onClick={() => setFilterBrand(brand)}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                      filterBrand === brand
                        ? 'bg-white/20 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {brand === 'all' ? '全部' : brand}
                  </button>
                ))}
              </div>
            </div>

            {/* 天梯图主体 */}
            <div className="flex flex-1 min-h-0">
              {/* 左侧天梯图 */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-1 tier-chart-scrollbar"
              >
                {/* 通用列表渲染 */}
                {getFilteredData().map((item: any, index: number) => (
                  <motion.div
                    key={`${type}-${index}-${item.name}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.01, 0.5) }}
                    onClick={() => {
                      if (type === 'gpu') setSelectedGPU(item);
                      else if (type === 'cpu') setSelectedCPU(item);
                      else if (type === 'monitor') setSelectedMonitor(item);
                      else if (type === 'mobilecpu') setSelectedMobileCPU(item);
                      else if (type === 'headphone') setSelectedHeadphone(item);
                      else if (type === 'router') setSelectedRouter(item);
                    }}
                    className={`relative cursor-pointer group transition-all duration-300 ${
                      (type === 'gpu' && selectedGPU?.id === item.id) ||
                      (type === 'cpu' && selectedCPU?.id === item.id) ||
                      (type === 'monitor' && selectedMonitor?.id === item.id) ||
                      (type === 'mobilecpu' && selectedMobileCPU?.id === item.id) ||
                      (type === 'headphone' && selectedHeadphone?.id === item.id) ||
                      (type === 'router' && selectedRouter?.id === item.id)
                        ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                    }`}
                  >
                    {/* 进度条背景 */}
                    <div className="relative h-11 bg-white/5 rounded-lg overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors">
                      {/* 性能条 */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.performance}%` }}
                        transition={{ duration: 0.6, delay: Math.min(index * 0.01, 0.5), ease: 'easeOut' }}
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${tierColors[item.tier]} opacity-40`}
                      />
                      
                      {/* 内容 */}
                      <div className="absolute inset-0 flex items-center px-3">
                        {/* 排名 */}
                        <div className="w-8 text-center shrink-0">
                          <span className={`text-sm font-bold ${
                            index < 3 ? 'text-yellow-400' : 'text-white/60'
                          }`}>
                            {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                          </span>
                        </div>
                        
                        {/* 品牌标识 */}
                        <div className={`px-1.5 py-0.5 rounded text-xs font-bold shrink-0 ${getBrandColors(item.brand).bg} ${getBrandColors(item.brand).text} ${getBrandColors(item.brand).border} border`}>
                          {item.brand}
                        </div>
                        
                        {/* 名称 */}
                        <div className="flex-1 ml-2 min-w-0">
                          <span className="text-white font-semibold text-sm truncate block">{item.name}</span>
                        </div>
                        
                        {/* 性能百分比 */}
                        <div className="text-right shrink-0">
                          <span className="text-white font-bold text-sm">{item.performance}%</span>
                        </div>
                      </div>
                      
                      {/* 悬停提示 */}
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-3">
                        <span className="text-white/60 text-xs">点击查看详情 →</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 右侧详情面板 */}
              <AnimatePresence mode="wait">
                <DetailPanel 
                  type={type} 
                  selectedGPU={selectedGPU}
                  selectedCPU={selectedCPU}
                  selectedMonitor={selectedMonitor}
                  selectedMobileCPU={selectedMobileCPU}
                  selectedHeadphone={selectedHeadphone}
                  selectedRouter={selectedRouter}
                  onClose={clearSelection}
                  getBrandColors={getBrandColors}
                />
              </AnimatePresence>
            </div>

            {/* 底部说明 */}
            <div className="px-6 py-2 bg-black/30 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>数据更新时间：2026年10月 | 仅供参考</span>
                <div className="flex items-center gap-3">
                  {Object.entries(tierColors).slice(0, 4).map(([tier, color]) => (
                    <div key={tier} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-sm bg-gradient-to-r ${color}`}></div>
                      <span>{tier}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 详情面板组件
function DetailPanel({ type, selectedGPU, selectedCPU, selectedMonitor, selectedMobileCPU, selectedHeadphone, selectedRouter, onClose, getBrandColors }: { 
  type: HardwareType; 
  selectedGPU: GPUData | null;
  selectedCPU: CPUData | null;
  selectedMonitor: MonitorData | null;
  selectedMobileCPU: MobileCPUData | null;
  selectedHeadphone: HeadphoneData | null;
  selectedRouter: RouterData | null;
  onClose: () => void;
  getBrandColors: (brand: string) => { bg: string; text: string; border: string };
}) {
  const selectedItem = type === 'gpu' ? selectedGPU 
    : type === 'cpu' ? selectedCPU
    : type === 'monitor' ? selectedMonitor
    : type === 'mobilecpu' ? selectedMobileCPU
    : type === 'headphone' ? selectedHeadphone
    : selectedRouter;

  const typeName = hardwareTypeInfo[type].name;
  const benchmark = hardwareTypeInfo[type].benchmark;

  if (!selectedItem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-80 border-l border-white/10 bg-black/20 p-5 flex items-center justify-center"
      >
        <div className="text-center text-white/40">
          <i className="fa-solid fa-hand-pointer text-4xl mb-4"></i>
          <p className="text-sm">点击左侧{typeName}<br/>查看详细信息</p>
        </div>
      </motion.div>
    );
  }

  // 获取规格列表
  const getSpecs = () => {
    switch (type) {
      case 'gpu':
        return [
          { label: '显存', value: selectedGPU.specs.vram },
          { label: '显存类型', value: selectedGPU.specs.vramType },
          { label: '流处理器', value: selectedGPU.specs.cores },
          { label: '工艺', value: selectedGPU.specs.process },
          { label: '带宽', value: selectedGPU.specs.bandwidth },
          { label: '功耗', value: selectedGPU.specs.tdp },
        ];
      case 'cpu':
        return [
          { label: '核心数', value: `${selectedCPU.cores}核` },
          { label: '线程数', value: `${selectedCPU.threads}线程` },
          { label: '基础频率', value: selectedCPU.baseClock },
          { label: '加速频率', value: selectedCPU.boostClock },
          { label: '缓存', value: selectedCPU.cache },
          { label: '工艺', value: selectedCPU.process },
          { label: '功耗', value: selectedCPU.tdp },
        ];
      case 'monitor':
        return [
          { label: '尺寸', value: selectedMonitor.specs.size },
          { label: '分辨率', value: selectedMonitor.specs.resolution },
          { label: '刷新率', value: selectedMonitor.specs.refreshRate },
          { label: '面板类型', value: selectedMonitor.specs.panelType },
          { label: '响应时间', value: selectedMonitor.specs.responseTime },
          { label: '色域', value: selectedMonitor.specs.colorGamut },
        ];
      case 'mobilecpu':
        return [
          { label: '工艺', value: selectedMobileCPU.specs.process },
          { label: 'CPU核心', value: selectedMobileCPU.specs.cpuCores },
          { label: 'GPU', value: selectedMobileCPU.specs.gpu },
          { label: 'AI算力', value: selectedMobileCPU.specs.aiScore },
        ];
      case 'headphone':
        return [
          { label: '类型', value: selectedHeadphone.specs.type },
          { label: '单元', value: selectedHeadphone.specs.driver },
          { label: '阻抗', value: selectedHeadphone.specs.impedance },
          { label: '灵敏度', value: selectedHeadphone.specs.sensitivity },
          { label: '连接方式', value: selectedHeadphone.specs.connectivity },
        ];
      case 'router':
        return [
          { label: 'WiFi标准', value: selectedRouter.specs.wifiStandard },
          { label: '最高速率', value: selectedRouter.specs.maxSpeed },
          { label: '频段', value: selectedRouter.specs.bands },
          { label: '网口', value: selectedRouter.specs.ports },
          { label: '处理器', value: selectedRouter.specs.cpu },
          { label: '天线', value: selectedRouter.specs.antennas },
        ];
      default:
        return [];
    }
  };

  return (
    <motion.div
      key={selectedItem.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-80 border-l border-white/10 bg-black/20 p-5 overflow-y-auto tier-chart-scrollbar"
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-white/40 hover:text-white transition-colors"
      >
        <i className="fa-solid fa-times"></i>
      </button>

      {/* 名称和品牌 */}
      <div className="text-center mb-4">
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${getBrandColors(selectedItem.brand).bg} ${getBrandColors(selectedItem.brand).text} ${getBrandColors(selectedItem.brand).border} border`}>
          {selectedItem.brand}
        </div>
        <h4 className="text-white text-xl font-bold">{selectedItem.name}</h4>
        <p className="text-white/50 text-sm mt-1">{selectedItem.tier}级{typeName}</p>
      </div>

      {/* 性能得分 */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-3 mb-4 border border-white/10">
        <div className="text-center">
          <span className="text-white/60 text-xs">性能得分</span>
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            {selectedItem.performance}%
          </div>
          <span className="text-white/40 text-xs">相对 {benchmark}</span>
        </div>
      </div>

      {/* 核心参数 */}
      <div className="mb-4">
        <h5 className="text-white/80 text-xs font-semibold mb-2 flex items-center gap-2">
          <i className="fa-solid fa-microchip"></i>核心参数
        </h5>
        <div className="grid grid-cols-2 gap-1.5">
          {getSpecs().map((spec: any, i: number) => (
            <div key={i} className={`bg-white/5 rounded-lg p-2 ${getSpecs().length % 2 !== 0 && i === getSpecs().length - 1 ? 'col-span-2' : ''}`}>
              <span className="text-white/50 text-xs">{spec.label}</span>
              <p className="text-white font-semibold text-sm">{spec.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 手机CPU显示搭载设备 */}
      {type === 'mobilecpu' && selectedItem.devices && (
        <div className="mb-4">
          <h5 className="text-white/80 text-xs font-semibold mb-2 flex items-center gap-2">
            <i className="fa-solid fa-mobile-screen"></i>搭载设备
          </h5>
          <div className="bg-white/5 rounded-lg p-2">
            <p className="text-white/80 text-sm">{selectedItem.devices}</p>
          </div>
        </div>
      )}

      {/* 显卡游戏性能 */}
      {type === 'gpu' && selectedGPU.gaming && (
        <div className="mb-4">
          <h5 className="text-white/80 text-xs font-semibold mb-2 flex items-center gap-2">
            <i className="fa-solid fa-gamepad"></i>游戏性能
          </h5>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
              <span className="text-white/60 text-xs">1080P</span>
              <span className="text-green-400 font-semibold text-sm">{selectedGPU.gaming.p1080}</span>
            </div>
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
              <span className="text-white/60 text-xs">2K</span>
              <span className="text-blue-400 font-semibold text-sm">{selectedGPU.gaming.p2k}</span>
            </div>
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
              <span className="text-white/60 text-xs">4K</span>
              <span className="text-purple-400 font-semibold text-sm">{selectedGPU.gaming.p4k}</span>
            </div>
          </div>
        </div>
      )}

      {/* 价格和发布日期 */}
      <div className="border-t border-white/10 pt-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-white/60 text-xs">参考价格</span>
          <span className="text-orange-400 font-bold text-sm">{selectedItem.price || '暂无'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/60 text-xs">发布时间</span>
          <span className="text-white/80 text-sm">{selectedItem.releaseDate}</span>
        </div>
      </div>
    </motion.div>
  );
}
