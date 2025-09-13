import { FC } from 'react';
import { styled } from '@mui/material/styles';

interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

const StyledFormField = styled('div')`
  margin-bottom: 20px;
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
    font-size: 1rem;
  }
  
  .required {
    color: #e53935;
    margin-left: 4px;
  }
  
  .error-text {
    color: #e53935;
    font-size: 0.875rem;
    margin-top: 4px;
    display: block;
  }
`;

export const FormField: FC<FormFieldProps> = ({
  label,
  error,
  required,
  children
}) => (
  <StyledFormField>
    <label>
      {label} {required && <span className="required">*</span>}
    </label>
    {children}
    {error && <span className="error-text">{error}</span>}
  </StyledFormField>
);
