import React, { useState } from 'react';
import type { CarType } from '../constants/CarDatas';
import { CAR_DATA } from '../constants/CarDatas';
import Slot from '../components/Compare/Slot.tsx';
import CarPicker from '../components/Compare/CarPicker.tsx';
import SpecTable from '../components/Compare/SpecTable.tsx';
import styles from '../styles/CompareStyle/_compare.module.scss';

const Compare: React.FC = () => {
  const [selected, setSelected] = useState<(CarType | null)[]>([null, null, null, null]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  const handleSelect = (index: number, car: CarType) => {
    const next = [...selected];
    next[index] = car;
    setSelected(next);
    setPickerOpen(false);
    setActiveSlotIndex(null);
  };

  const handleRemove = (index: number) => {
    const next = [...selected];
    next[index] = null;
    setSelected(next);
  };

  const handleOpenPicker = (index: number) => {
    setActiveSlotIndex(index);
    setPickerOpen(true);
  };

  const handleClosePicker = () => {
    setPickerOpen(false);
    setActiveSlotIndex(null);
  };

  const selectedCars = selected.filter((car): car is CarType => car !== null);
  const showSpecTable = selectedCars.length >= 2;

  return (
    <div className={styles.comparePage}>
      <div className={styles.simpleHeader}>
        <div className={styles.container}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>So sánh xe</h1>
            <p className={styles.subtitle}>
              Chọn tối đa 4 mẫu xe để so sánh chi tiết các thông số kỹ thuật
            </p>
            <div className={styles.progressWrapper}>
              <div className={styles.progressCard}>
                <div className={styles.progressInfo}>
                  <span className={styles.progressLabel}>Đã chọn</span>
                  <span className={styles.progressCount}>
                    {selectedCars.length}/4 <span>xe</span>
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${(selectedCars.length / 4) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.slotsSection}>
          <div className={styles.slots}>
            {selected.map((car, index) => (
              <Slot
                key={index}
                car={car}
                onSelect={() => handleOpenPicker(index)}
                onRemove={() => handleRemove(index)}
                index={index}
              />
            ))}
          </div>
        </div>

        {showSpecTable && (
          <div className={styles.specSection}>
            <SpecTable selectedCars={selectedCars} />
          </div>
        )}

        {pickerOpen && activeSlotIndex !== null && (
          <CarPicker
            cars={CAR_DATA.flat()}
            onSelect={(car: CarType) => handleSelect(activeSlotIndex, car)}
            onClose={handleClosePicker}
            selectedCars={selected}
          />
        )}
      </div>
    </div>
  );
};

export default Compare;