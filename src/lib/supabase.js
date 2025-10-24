import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://wasrwhlzzmxqwiwwxtxe.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhc3J3aGx6em14cXdpd3d4dHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3NzI4NjcsImV4cCI6MjA0NTM0ODg2N30.yVF8vIU-HBhNMM3h9FYyLgR6Gm_2z5oO8lq9XkEyD3w";

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

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
        console.error("Error finding user:", error);
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
        console.error("Error creating user:", error);
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
        console.error("Error updating user:", error);
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
        console.error("Error fetching events:", error);
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
        console.error("Error finding event:", error);
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
        console.error("Error creating event:", error);
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
        console.error("Error fetching bookings:", error);
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
        console.error("Error creating booking:", error);
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
        console.error("Error creating contact message:", error);
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
        console.error("Error updating contact message:", error);
        throw error;
      }
      return message;
    },
  },
};

// Export for backwards compatibility
export { supabase as default };
