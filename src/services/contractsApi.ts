import apiClient from '../lib/apiClient';
import type { Contract, ContractPayload } from '../types/contract';

// Transform payload to match backend API format
interface CreateContractRequest {
  dealerId: number;
  orderId: string;
  terms: string;
}

// Create new contract
export async function createContract(payload: ContractPayload): Promise<Contract> {
  try {
    // Transform to backend format
    const requestBody: CreateContractRequest = {
      dealerId: Number(payload.dealer.id) || 0,
      orderId: payload.orderId,
      terms: JSON.stringify(payload.terms) || '',
    };
    
    const response = await apiClient.post<Contract>('/api/contracts', requestBody);
    
    // CRITICAL: Check if orderId is in response
    if (!response.data.orderId) {
      console.error('⚠️ Backend did not return orderId in response!');
      console.error('Request had orderId:', requestBody.orderId);
      console.error('Response:', response.data);
      // Manually add orderId to response if backend doesn't return it
      response.data.orderId = requestBody.orderId;
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Create contract error:', error?.response?.data);
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
    const response = await apiClient.get('/api/contracts');
    // Handle different response structures
    const data = response.data;
    
    let contracts: Contract[] = [];
    
    // If response.data is already an array
    if (Array.isArray(data)) {
      contracts = data;
    }
    // If response.data has a 'data' property that's an array
    else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
      contracts = data.data;
    }
    // If response.data has a 'contracts' property that's an array
    else if (data && typeof data === 'object' && 'contracts' in data && Array.isArray(data.contracts)) {
      contracts = data.contracts;
    }
    else {
      // Default to empty array
      console.warn('Unexpected API response structure:', data);
      contracts = [];
    }
    
    
    // Debug: Log orderId mapping
    contracts.forEach((contract, index) => {
      if (!contract.orderId) {
        console.warn(`⚠️ Contract ${index} (ID: ${contract.id}) is missing orderId!`);
      } else {
      }
    });
    
    return contracts;
  } catch (error: any) {
    console.error('Get all contracts error:', error?.response?.data || error);
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

// Submit contract to customer (Admin action)
export const submitContract = async (contractId: number): Promise<Contract> => {
  try {
    const response = await apiClient.put<Contract>(`/api/contracts/${contractId}/submit`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Không thể gửi hợp đồng cho khách hàng');
  }
};

/**
 * Upload PDF file for contract
 * @param contractId - Contract ID
 * @param pdfBlob - PDF file as Blob
 * @returns Upload result
 */
export const uploadContractPdf = async (
  contractId: number | string,
  pdfBlob: Blob
): Promise<{ message?: string; success?: boolean }> => {
  try {
    const formData = new FormData();
    
    // Tạo tên file unique với timestamp
    const fileName = `hop-dong-${contractId}-${Date.now()}.pdf`;
    formData.append('file', pdfBlob, fileName);

    const token = localStorage.getItem('token');
    const response = await fetch(
      `http://localhost:8080/api/contracts/${contractId}/upload-pdf-new`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*',
          // KHÔNG set Content-Type, browser tự động set với boundary
        },
        body: formData
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload PDF error response:', errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json().catch(() => ({ success: true }));
    return result;
  } catch (error: any) {
    console.error('❌ Upload contract PDF error:', error);
    throw new Error(error.message || 'Không thể tải PDF lên server');
  }
};

/**
 * Download PDF file for contract
 * @param contractId - Contract ID
 * @returns PDF file as Blob
 */
export const downloadContractPdf = async (
  contractId: number | string
): Promise<Blob> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `http://localhost:8080/api/contracts/${contractId}/download`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error: any) {
    console.error('❌ Download contract PDF error:', error);
    throw new Error(error.message || 'Không thể tải PDF từ server');
  }
};

// Save manufacturer signature
export async function saveManufacturerSignature(
  contractId: string, 
  signatureData: string
): Promise<Contract> {
  try {
    const response = await apiClient.put<Contract>(
      `/api/contracts/${contractId}/sign/manufacturer`,
      { signatureData }
    );
    return response.data;
  } catch (error: any) {
    console.error('❌ Save signature error:', error);
    throw new Error(error?.response?.data?.message || 'Không thể lưu chữ ký');
  }
}

// Save dealer signature
export async function saveDealerSignature(
  contractId: string, 
  signatureData: string
): Promise<Contract> {
  try {
    const response = await apiClient.put<Contract>(
      `/api/contracts/${contractId}/sign/dealer`,
      { signatureData }
    );
    return response.data;
  } catch (error: any) {
    console.error('❌ Save dealer signature error:', error);
    throw new Error(error?.response?.data?.message || 'Không thể lưu chữ ký đại lý');
  }
}
