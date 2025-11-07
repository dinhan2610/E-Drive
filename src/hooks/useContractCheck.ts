import { useState, useEffect, useCallback } from 'react';
import { getAllContracts } from '../services/contractsApi';
import type { Contract } from '../types/contract';

/**
 * Hook to check if orders have contracts
 * Returns a map of orderId -> contract for quick lookup
 */
export const useContractCheck = () => {
  const [contractMap, setContractMap] = useState<Map<string, Contract>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Wrap in useCallback to make it stable across renders
  // This prevents infinite loops when used in useEffect dependencies
  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const contracts = await getAllContracts();
      
      // Create a map for O(1) lookup
      const map = new Map<string, Contract>();
      contracts.forEach(contract => {
        if (contract.orderId) {
          map.set(String(contract.orderId), contract);
        }
      });
      
      setContractMap(map);
      console.log('✅ Contract map loaded:', map.size, 'contracts');
    } catch (err: any) {
      console.error('❌ Error loading contracts:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - function is stable

  useEffect(() => {
    loadContracts();
  }, []);

  const hasContract = (orderId: string | number): boolean => {
    return contractMap.has(String(orderId));
  };

  const getContract = (orderId: string | number): Contract | undefined => {
    return contractMap.get(String(orderId));
  };

  /**
   * Get contractId directly by orderId for optimized operations
   * Returns contractId if exists, undefined otherwise
   */
  const getContractId = (orderId: string | number): string | undefined => {
    const contract = contractMap.get(String(orderId));
    return contract?.id;
  };

  return {
    contractMap,
    loading,
    error,
    hasContract,
    getContract,
    getContractId, // Direct contractId lookup
    reload: loadContracts,
  };
};
