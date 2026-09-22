import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Safe Supabase Admin / Service Role Client helper
export const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Only use service key if it's a valid JWT starting with eyJ
  const keyToUse =
    serviceKey && serviceKey.trim().startsWith("eyJ")
      ? serviceKey.trim()
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseKey;

  return createClient(url, keyToUse, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Database helper functions
export const db = {
  // Users
  users: {
    async findUnique(where) {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", where.id || where.email)
        .single();

      if (error && error.code !== "PGRST116") {
        return null;
      }
      return data;
    },

    async create(data) {
      const { data: user, error } = await supabase
        .from("users")
        .insert([data])
        .select()
        .single();

      if (error) {
        throw error;
      }
      return user;
    },

    async update(where, data) {
      const { data: user, error } = await supabase
        .from("users")
        .update(data)
        .eq("id", where.id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return user;
    },
  },

  // Events
  events: {
    async findMany(options = {}) {
      let query = supabase.from("events").select("*");

      if (options.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (options.orderBy) {
        const { field, direction } = options.orderBy;
        query = query.order(field, { ascending: direction === "asc" });
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      return data || [];
    },

    async findUnique(where) {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", where.id)
        .single();

      if (error && error.code !== "PGRST116") {
        return null;
      }
      return data;
    },

    async create(data) {
      const { data: event, error } = await supabase
        .from("events")
        .insert([data])
        .select()
        .single();

      if (error) {
        throw error;
      }
      return event;
    },
  },

  // Bookings
  bookings: {
    async findMany(options = {}) {
      let query = supabase.from("bookings").select("*");

      if (options.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (options.include?.event) {
        query = supabase.from("bookings").select(`
          *,
          Event (*)
        `);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      return data || [];
    },

    async create(data) {
      const { data: booking, error } = await supabase
        .from("bookings")
        .insert([data])
        .select()
        .single();

      if (error) {
        throw error;
      }
      return booking;
    },
  },

  // Contact Messages
  contactMessages: {
    async create(data) {
      const { data: message, error } = await supabase
        .from("contact_messages")
        .insert([data])
        .select()
        .single();

      if (error) {
        throw error;
      }
      return message;
    },

    async update(where, data) {
      const { data: message, error } = await supabase
        .from("contact_messages")
        .update(data)
        .eq("id", where.id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return message;
    },
  },
};

// Export for backwards compatibility
export { supabase as default };
