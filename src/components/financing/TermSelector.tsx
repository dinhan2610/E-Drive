import React from 'react';
import type { FinancingTerm } from '../../utils/financing';
import { FINANCING_TERMS } from '../../utils/financing';
import styles from './TermSelector.module.scss';

interface TermSelectorProps {
  value: FinancingTerm;
  onChange: (term: FinancingTerm) => void;
}

const TermSelector: React.FC<TermSelectorProps> = ({ value, onChange }) => {
  return (
    <div className={styles.termSelector}>
      <label className={styles.label}>
        <i className="fas fa-calendar-alt"></i>
        Kỳ hạn trả góp
      </label>
      
      <div className={styles.terms}>
        {FINANCING_TERMS.map((term) => (
          <button
            key={term}
            type="button"
            className={`${styles.termButton} ${value === term ? styles.active : ''}`}
            onClick={() => onChange(term)}
            aria-pressed={value === term}
          >
            <span className={styles.termNumber}>{term}</span>
            <span className={styles.termLabel}>tháng</span>
          </button>
        ))}
      </div>

      <p className={styles.note}>
        <i className="fas fa-info-circle"></i>
        Lãi suất <strong>0%</strong> cho tất cả các kỳ hạn
      </p>
    </div>
  );
};

export default TermSelector;
