import React from 'react';

const Slider = ({ value }: { value: number }, onChange: (value: number) => void, min: number, max: number, step: number) => {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  return (
    <input
      type="range"
      value={value}
      onChange={handleInputChange}
      min={min}
      max={max}
      step={step}
    />
  );
};

export { Slider }