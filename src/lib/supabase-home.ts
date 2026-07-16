import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = 'https://oucetnvyfghlwvjzlra.supabase.co';
const supabaseAnonKey = 'sb_publishable_9dF4Phi97CH6GxwDiGMViQ_ihKby5tp';

// 初始化 Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
