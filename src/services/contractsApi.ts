import apiClient from '../lib/apiClient';
import type { Contract, ContractPayload } from '../types/contract';

// Create new contract
export async function createContract(payload: ContractPayload): Promise<Contract> {
  try {
    const response = await apiClient.post<Contract>('/api/contracts', payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Không thể tạo hợp đồng');
  }
}

// Generate contract PDF
export async function generateContractPdf(id: string): Promise<{ pdfUrl: string }> {
  try {
    const response = await apiClient.post<{ pdfUrl: string }>(`/api/contracts/${id}/pdf`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Không thể tạo PDF hợp đồng');
  }
}

// Start e-signature process
export async function startESign(id: string): Promise<{ signRequestId: string }> {
  try {
    const response = await apiClient.post<{ signRequestId: string }>(`/api/contracts/${id}/sign/start`);
    return response.data;
  } catch (error: any) {
    // Stub fallback for development
    console.warn('Using stub for e-sign:', error.message);
    return {
      signRequestId: `ESIGN-${id}-${Date.now()}`,
    };
  }
}

// Get contract by ID
export async function getContract(id: string): Promise<Contract> {
  try {
    const response = await apiClient.get<Contract>(`/api/contracts/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Không thể lấy thông tin hợp đồng');
  }
}

// Get all contracts
export const getAllContracts = async (): Promise<Contract[]> => {
  try {
    const response = await apiClient.get<Contract[]>('/api/contracts');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Không thể lấy danh sách hợp đồng');
  }
};

// Update contract status
export const updateContractStatus = async (
  id: string,
  status: 'DRAFT' | 'SIGNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
): Promise<Contract> => {
  try {
    const response = await apiClient.patch<Contract>(`/api/contracts/${id}`, { status });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Không thể cập nhật trạng thái hợp đồng');
  }
};
