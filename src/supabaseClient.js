import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://hcaifttlndeqqbrviodw.supabase.co"
const SUPABASE_ANON_KEY = "sb_publishable_YVF5lA3xIi_STXglZUGDqQ_MBwlBw7p"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)