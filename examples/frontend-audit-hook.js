// EJEMPLO: Hook para auditoría desde el frontend
// Archivo: hooks/useAuditLogger.js

import { auditService } from '@/services/auditService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-toastify';

export const useAuditLogger = () => {
  const { user } = useAuth();

  // Método para registrar restauraciones
  const logRestore = async (entity, entityId, restoredData, description, metadata = {}) => {
    try {
      const auditData = {
        action: 'RESTORE',
        entity: entity.toUpperCase(),
        entityId: entityId.toString(),
        description,
        changesAfter: restoredData,
        metadata: {
          ...metadata,
          restoredAt: new Date().toISOString(),
          restoredBy: user?.email,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }
      };

      await auditService.logAction(auditData);
      console.log('✅ Auditoría de restauración registrada:', auditData);
    } catch (error) {
      console.error('❌ Error registrando auditoría de restauración:', error);
      // No mostrar error al usuario para no interferir con la operación principal
    }
  };

  // Método para registrar creaciones
  const logCreate = async (entity, entityId, createdData, description, metadata = {}) => {
    try {
      const auditData = {
        action: 'CREATE',
        entity: entity.toUpperCase(),
        entityId: entityId.toString(),
        description,
        changesAfter: createdData,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
          createdBy: user?.email,
          userAgent: navigator.userAgent,
        }
      };

      await auditService.logAction(auditData);
    } catch (error) {
      console.error('❌ Error registrando auditoría de creación:', error);
    }
  };

  // Método para registrar eliminaciones
  const logDelete = async (entity, entityId, deletedData, description, metadata = {}) => {
    try {
      const auditData = {
        action: 'DELETE',
        entity: entity.toUpperCase(),
        entityId: entityId.toString(),
        description,
        changesBefore: deletedData,
        metadata: {
          ...metadata,
          deletedAt: new Date().toISOString(),
          deletedBy: user?.email,
          userAgent: navigator.userAgent,
        }
      };

      await auditService.logAction(auditData);
    } catch (error) {
      console.error('❌ Error registrando auditoría de eliminación:', error);
    }
  };

  return {
    logRestore,
    logCreate,
    logDelete,
  };
};

// EJEMPLO DE USO: Componente para restaurar boletas
// Archivo: components/BoletaActions.jsx

import React from 'react';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { boletasService } from '@/services/boletasService';
import { toast } from 'react-toastify';

const BoletaActions = ({ boleta }) => {
  const { logRestore, logDelete } = useAuditLogger();

  // Función para restaurar boleta
  const handleRestore = async (boletaId) => {
    try {
      // 1. Llamar al endpoint de restauración
      const restoredBoleta = await boletasService.restore(boletaId);
      
      // 2. 🎯 REGISTRAR EN AUDITORÍA
      await logRestore(
        'reportes', 
        boletaId, 
        restoredBoleta,
        `Se restauró boleta municipal - ID: ${boletaId} - Operador: ${restoredBoleta.operador?.name || 'Sin operador'}`,
        {
          operatorId: restoredBoleta.operador?.id,
          machineryId: restoredBoleta.maquinaria?.id,
          wasDeletedAt: restoredBoleta.restoreInfo?.wasDeletedAt,
          deleteReason: restoredBoleta.restoreInfo?.deleteReason,
        }
      );
      
      toast.success("✅ Boleta restaurada exitosamente");
      
      // 3. Actualizar UI o recargar datos
      onBoletaRestored?.(restoredBoleta);
      
    } catch (error) {
      console.error('Error al restaurar boleta:', error);
      toast.error("❌ Error al restaurar boleta");
    }
  };

  // Función para eliminar boleta
  const handleDelete = async (boletaId, reason) => {
    try {
      // Obtener datos antes de eliminar
      const boletaData = await boletasService.getById(boletaId);
      
      // Eliminar boleta
      await boletasService.softDelete(boletaId, reason);
      
      // 🎯 REGISTRAR EN AUDITORÍA
      await logDelete(
        'reportes',
        boletaId,
        boletaData,
        `Se eliminó boleta municipal - ID: ${boletaId} - Motivo: ${reason}`,
        {
          deleteReason: reason,
          operatorId: boletaData.operador?.id,
          machineryId: boletaData.maquinaria?.id,
        }
      );
      
      toast.success("✅ Boleta eliminada exitosamente");
      
    } catch (error) {
      console.error('Error al eliminar boleta:', error);
      toast.error("❌ Error al eliminar boleta");
    }
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={() => handleRestore(boleta.id)}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        🔄 Restaurar
      </button>
      
      <button 
        onClick={() => handleDelete(boleta.id, 'Eliminación manual')}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        🗑️ Eliminar
      </button>
    </div>
  );
};

export default BoletaActions;

// EJEMPLO: Servicio de auditoría
// Archivo: services/auditService.js

import api from './api';

export const auditService = {
  // Registrar acción de auditoría desde frontend
  async logAction(auditData) {
    try {
      const response = await api.post('/audit/log-action', auditData);
      return response.data;
    } catch (error) {
      console.error('Error logging audit action:', error);
      throw error;
    }
  },

  // Obtener logs de auditoría
  async getLogs(filters = {}) {
    try {
      const response = await api.get('/audit/logs', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  // Obtener estadísticas de auditoría
  async getStats() {
    try {
      const response = await api.get('/audit/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      throw error;
    }
  }
};

// EJEMPLO: Servicio de boletas
// Archivo: services/boletasService.js

import api from './api';

export const boletasService = {
  // Restaurar boleta (reporte municipal)
  async restore(boletaId) {
    try {
      const response = await api.patch(`/machinery/report/${boletaId}/restore`);
      return response.data;
    } catch (error) {
      console.error('Error restoring boleta:', error);
      throw error;
    }
  },

  // Restaurar boleta de alquiler
  async restoreRental(boletaId) {
    try {
      const response = await api.patch(`/machinery/rental-report/${boletaId}/restore`);
      return response.data;
    } catch (error) {
      console.error('Error restoring rental boleta:', error);
      throw error;
    }
  },

  // Eliminar boleta (soft delete)
  async softDelete(boletaId, reason) {
    try {
      const response = await api.delete(`/machinery/report/${boletaId}`, {
        data: { reason }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting boleta:', error);
      throw error;
    }
  },

  // Obtener boleta por ID
  async getById(boletaId) {
    try {
      const response = await api.get(`/machinery/report/${boletaId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching boleta:', error);
      throw error;
    }
  }
};