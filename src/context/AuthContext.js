import React, { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { supabase } from "lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session (v1.x API)
    const session = supabase.auth.session();
    if (session?.user) {
      setUser(session.user);
      fetchUserProfile(session.user.id);
    }
    setLoading(false);

    // Listen for auth changes (v1.x API)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select(
        `
        *,
        role:roles(id, name, description),
        fleet:fleets(id, name, logo_url)
      `
      )
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    setUserProfile(data);
    return data;
  };

  const signIn = async (email, password) => {
    // v1.x API uses signIn instead of signInWithPassword
    const { user, error } = await supabase.auth.signIn({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return user;
  };

  const signUp = async (email, password, fleetId) => {
    const { user, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // Create user profile after signup
    if (user) {
      // Get the default 'user' role id
      const { data: roleData } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "user")
        .single();

      const { error: profileError } = await supabase.from("user_profiles").insert({
        id: user.id,
        fleet_id: fleetId,
        role_id: roleData?.id,
      });

      if (profileError) {
        console.error("Error creating user profile:", profileError);
        throw profileError;
      }
    }

    return user;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    isAuthenticated: !!user,
    isAdmin: userProfile?.role?.name === "admin",
    isSuperAdmin: userProfile?.role?.name === "superadmin",
    roleName: userProfile?.role?.name,
    fleetId: userProfile?.fleet_id,
    fleetName: userProfile?.fleet?.name,
    fleetLogoUrl: userProfile?.fleet?.logo_url,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
