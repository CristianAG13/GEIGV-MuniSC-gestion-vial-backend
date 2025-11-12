/**
 * EJEMPLO DE INTEGRACIÓN FRONTEND
 * 
 * Este archivo muestra cómo integrar el endpoint /users/me
 * en un componente React para rellenar boletas automáticamente
 */

// ============================================
// 1. SERVICIO API (api/userService.js)
// ============================================

export const userService = {
  /**
   * Obtener información del usuario actual
   */
  async getMyInfo() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch('http://localhost:3000/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener información del usuario');
    }

    return await response.json();
  },
};

// ============================================
// 2. CUSTOM HOOK (hooks/useCurrentUser.js)
// ============================================

import { useState, useEffect } from 'react';
import { userService } from '../api/userService';

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await userService.getMyInfo();
        setUser(userData);
        setError(null);
      } catch (err) {
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const refetch = async () => {
    setLoading(true);
    try {
      const userData = await userService.getMyInfo();
      setUser(userData);
      setError(null);
    } catch (err) {
      setError(err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, refetch };
}

// ============================================
// 3. COMPONENTE DE PERFIL (components/UserProfile.jsx)
// ============================================

import React from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';

export function UserProfile() {
  const { user, loading, error } = useCurrentUser();

  if (loading) {
    return (
      <div className="loading">
        <p>Cargando información...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="no-user">
        <p>No se pudo cargar la información del usuario</p>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <h2>Mi Perfil</h2>
      <div className="profile-info">
        <div className="info-item">
          <label>ID:</label>
          <span>{user.id}</span>
        </div>
        <div className="info-item">
          <label>Nombre:</label>
          <span>{user.name} {user.lastname}</span>
        </div>
        <div className="info-item">
          <label>Email:</label>
          <span>{user.email}</span>
        </div>
        <div className="info-item">
          <label>Roles:</label>
          <span>{user.roles.join(', ')}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 4. COMPONENTE CREAR BOLETA (components/CreateBoletaForm.jsx)
// ============================================

import React, { useState } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';

export function CreateBoletaForm() {
  const { user, loading, error } = useCurrentUser();
  const [formData, setFormData] = useState({
    maquinariaId: '',
    descripcion: '',
    fecha: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('No se pudo obtener el ID del inspector');
      return;
    }

    const boletaData = {
      ...formData,
      inspectorId: user.id, // ✅ Usar el ID del usuario actual
      inspectorName: `${user.name} ${user.lastname}`,
    };

    console.log('Enviando boleta:', boletaData);
    
    // Aquí irían las llamadas a la API para crear la boleta
    // await boletaService.create(boletaData);
  };

  if (loading) {
    return <div>Cargando información del inspector...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!user) {
    return <div>No se pudo cargar la información del usuario</div>;
  }

  return (
    <div className="create-boleta-form">
      <h2>Crear Nueva Boleta</h2>
      
      {/* Información del inspector (solo lectura) */}
      <div className="inspector-info">
        <h3>Inspector/Ingeniero</h3>
        <p>
          <strong>{user.name} {user.lastname}</strong>
          <br />
          ID: {user.id} | {user.email}
          <br />
          Rol: {user.roles.join(', ')}
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="maquinariaId">Maquinaria:</label>
          <select
            id="maquinariaId"
            value={formData.maquinariaId}
            onChange={(e) => setFormData({ ...formData, maquinariaId: e.target.value })}
            required
          >
            <option value="">Seleccionar maquinaria</option>
            {/* Opciones de maquinaria */}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">Descripción:</label>
          <textarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="fecha">Fecha:</label>
          <input
            type="date"
            id="fecha"
            value={formData.fecha}
            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            required
          />
        </div>

        <button type="submit" className="btn-primary">
          Crear Boleta
        </button>
      </form>
    </div>
  );
}

// ============================================
// 5. NAVBAR CON INFO DEL USUARIO (components/Navbar.jsx)
// ============================================

import React from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';

export function Navbar() {
  const { user, loading } = useCurrentUser();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Sistema de Gestión Vial</h1>
      </div>
      
      <div className="navbar-user">
        {loading ? (
          <span>Cargando...</span>
        ) : user ? (
          <div className="user-info">
            <span className="user-name">{user.name} {user.lastname}</span>
            <span className="user-role">{user.roles[0]}</span>
            <span className="user-id">ID: {user.id}</span>
          </div>
        ) : (
          <span>Usuario no identificado</span>
        )}
      </div>
    </nav>
  );
}

// ============================================
// 6. CONTEXTO GLOBAL (context/UserContext.jsx)
// ============================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../api/userService';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await userService.getMyInfo();
      setCurrentUser(userData);
      setError(null);
    } catch (err) {
      setError(err.message);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = () => {
    setLoading(true);
    loadUser();
  };

  const value = {
    currentUser,
    loading,
    error,
    refreshUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe usarse dentro de un UserProvider');
  }
  return context;
}

// ============================================
// 7. USO DEL CONTEXTO EN APP (App.jsx)
// ============================================

import React from 'react';
import { UserProvider } from './context/UserContext';
import { Navbar } from './components/Navbar';
import { CreateBoletaForm } from './components/CreateBoletaForm';

function App() {
  return (
    <UserProvider>
      <div className="app">
        <Navbar />
        <main>
          <CreateBoletaForm />
        </main>
      </div>
    </UserProvider>
  );
}

export default App;

// ============================================
// 8. EJEMPLO CON REDUX (si usas Redux)
// ============================================

// store/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '../api/userService';

export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrent',
  async () => {
    const response = await userService.getMyInfo();
    return response;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearUser: (state) => {
      state.currentUser = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearUser } = userSlice.actions;
export default userSlice.reducer;

// ============================================
// 9. EJEMPLO CON AXIOS (alternativa a fetch)
// ============================================

import axios from 'axios';

// Configurar instancia de Axios
const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Servicio con Axios
export const userServiceAxios = {
  async getMyInfo() {
    const { data } = await api.get('/users/me');
    return data;
  },
};

// ============================================
// 10. EJEMPLO CON REACT QUERY
// ============================================

import { useQuery } from '@tanstack/react-query';
import { userService } from '../api/userService';

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: userService.getMyInfo,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

// Uso en componente
function MyComponent() {
  const { data: user, isLoading, error } = useCurrentUserQuery();

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Bienvenido, {user.name}!</h2>
      <p>Tu ID es: {user.id}</p>
    </div>
  );
}
