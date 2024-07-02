import React, { useEffect, useState } from 'react';

interface FilingCabinetProps {
  userId: string;
}

const FilingCabinet: React.FC<FilingCabinetProps> = ({ userId }) => {
  const [cases, setCases] = useState<any[]>([]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch(`/api/get-user-cases?user_id=${userId}`);
        if (!response.ok) {
          throw new Error(`Error fetching cases: ${response.statusText}`);
        }
        const data = await response.json();
        setCases(data);
      } catch (error) {
        console.error('Error fetching cases:', error);
      }
    };

    fetchCases();
  }, [userId]);

  return (
    <div>
      <h2>Filing Cabinet</h2>
      <ul>
        {cases.map((caseItem, index) => (
          <li key={index}>{caseItem.case_name}</li>
        ))}
      </ul>
    </div>
  );
};

export default FilingCabinet;
