// // src/db/supabase.js
// const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config();

// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_ANON_KEY
// );

// module.exports = supabase;

// src/db/supabase.js
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!process.env.SUPABASE_URL || !supabaseKey) {
  throw new Error(
    "Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY in environment",
  );
}

const supabase = createClient(process.env.SUPABASE_URL, supabaseKey);

module.exports = supabase;
